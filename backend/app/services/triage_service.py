import os
import json
import time
import datetime
from sqlalchemy.orm import Session

from app.models.image import Image
from app.models.station import CameraStation
from app.models.tiger import Tiger, TigerCapture, TigerMovementObservation, TigerAreaStatistics
from app.models.run import ProcessingRun
from app.models.alert import Alert
from app.ml.blank_detector import BlankDetector
from app.ml.tiger_detector import TigerDetector
from app.ml.stripe_matcher import StripeMatcher
from app.gis.spatial_engine import SpatialEngine
from app.alerts.alert_engine import AlertEngine
from app.services.storage_service import StorageService
from app.services.emergency_alert_service import EmergencyAlertService

class TriageService:
    def __init__(self, db: Session):
        self.db = db
        self.blank_detector = BlankDetector()
        self.tiger_detector = TigerDetector()
        self.stripe_matcher = StripeMatcher()
        self.alert_engine = AlertEngine()

    def process_run(self, run_id: int, image_ids: list[int]):
        """
        Executes complete camera trap processing pipeline asynchronously / in background.
        """
        run = self.db.query(ProcessingRun).filter(ProcessingRun.id == run_id).first()
        if not run:
            return

        start_time = time.time()
        blank_cnt = 0
        retained_cnt = 0
        tiger_cnt = 0
        new_tiger_cnt = 0
        review_cnt = 0
        storage_saved_mb = 0.0

        known_tigers = self.db.query(Tiger).all()
        known_tigers_dict = [
            {
                "id": t.id,
                "tiger_code": t.tiger_code,
                "display_name": t.display_name,
                "stripe_embedding": t.stripe_embedding
            }
            for t in known_tigers
        ]

        images = self.db.query(Image).filter(Image.id.in_(image_ids)).all()

        for img in images:
            station = self.db.query(CameraStation).filter(CameraStation.id == img.station_id).first()
            if not station:
                continue

            # 1. Blank Detection & Safe Quarantine
            blank_result = self.blank_detector.classify_image(img.original_path)
            
            if blank_result["classification"] == "BLANK":
                blank_cnt += 1
                q_path = StorageService.quarantine_image(img.original_path, img.filename)
                img.status = "QUARANTINED"
                img.processed_path = q_path
                img.subject_detected = "blank"
                img.subject_type = "blank"
                img.detection_confidence = blank_result["confidence"]
                # Save ~3MB per quarantined raw file
                storage_saved_mb += 3.0
            
            elif blank_result["classification"] == "UNCERTAIN":
                review_cnt += 1
                r_path = StorageService.retain_image(img.original_path, img.filename)
                img.status = "REVIEW_REQUIRED"
                img.processed_path = r_path
                img.subject_detected = "uncertain"
                img.detection_confidence = blank_result["confidence"]

            else:
                # 2. Retain & Detect Subject
                retained_cnt += 1
                r_path = StorageService.retain_image(img.original_path, img.filename)
                img.processed_path = r_path

                det = self.tiger_detector.detect_subject(r_path)
                img.subject_detected = det["subject_type"]
                img.subject_type = det["subject_type"]
                img.detection_confidence = det["confidence"]
                img.bounding_box = det["bounding_box"]

                if det["subject_type"] == "tiger":
                    tiger_cnt += 1
                    
                    # 3. Stripe Feature Extraction & Re-ID
                    cand_emb = self.stripe_matcher.generate_embedding(r_path, det["bounding_box"])
                    cand_emb_str = json.dumps(cand_emb)

                    match_res = self.stripe_matcher.match_against_catalogue(cand_emb, known_tigers_dict)

                    if match_res["decision"] == "AUTOMATIC_MATCH":
                        img.status = "PROCESSED"
                        matched_tiger_id = match_res["best_match_tiger_id"]
                        
                        # Record capture
                        cap = TigerCapture(
                            tiger_id=matched_tiger_id,
                            image_id=img.id,
                            station_id=station.id,
                            captured_at=img.captured_at,
                            latitude=station.latitude,
                            longitude=station.longitude,
                            identification_confidence=match_res["similarity_score"],
                            identification_method="AI_MATCH",
                            review_status="CONFIRMED"
                        )
                        self.db.add(cap)

                        # Record movement observation
                        obs = TigerMovementObservation(
                            tiger_id=matched_tiger_id,
                            station_id=station.id,
                            latitude=station.latitude,
                            longitude=station.longitude,
                            timestamp=img.captured_at,
                            confidence=match_res["similarity_score"],
                            source_image_id=img.id
                        )
                        self.db.add(obs)

                        # Update tiger metadata
                        target_t = self.db.query(Tiger).filter(Tiger.id == matched_tiger_id).first()
                        if target_t:
                            target_t.last_seen = img.captured_at

                        # Evaluate Alerts
                        hist_stations = [
                            c.station_id for c in self.db.query(TigerCapture.station_id)
                            .filter(TigerCapture.tiger_id == matched_tiger_id).all()
                        ]
                        
                        alerts = self.alert_engine.evaluate_new_capture(
                            tiger_id=matched_tiger_id,
                            tiger_code=match_res["best_match_tiger_code"],
                            display_name=target_t.display_name if target_t else match_res["best_match_tiger_code"],
                            station_id=station.id,
                            station_code=station.station_code,
                            region_type=station.region_type,
                            captured_at=img.captured_at,
                            historical_stations=hist_stations,
                            new_lat=station.latitude,
                            new_lon=station.longitude
                        )
                        for a in alerts:
                            alert_obj = Alert(**a)
                            self.db.add(alert_obj)
                            self.db.flush()  # get alert_obj.id

                            # ── Emergency Response Hook ──────────────────────────
                            # If the alert is CRITICAL, trigger the automated call
                            # workflow in a background thread. This is non-blocking.
                            if alert_obj.severity == "CRITICAL":
                                try:
                                    EmergencyAlertService.handle_critical_alert(
                                        self.db, alert_obj
                                    )
                                except Exception as ex:
                                    import logging
                                    logging.getLogger(__name__).warning(
                                        f"Emergency call hook failed for alert {alert_obj.id}: {ex}"
                                    )
                            # ────────────────────────────────────────────────────

                    elif match_res["decision"] == "HUMAN_REVIEW":
                        review_cnt += 1
                        img.status = "REVIEW_REQUIRED"
                    
                    else: # NEW_INDIVIDUAL
                        new_tiger_cnt += 1
                        img.status = "PROCESSED"
                        
                        # Auto-enroll new tiger identity
                        new_code = f"TIGER-00{len(known_tigers_dict) + 1}"
                        new_t = Tiger(
                            tiger_code=new_code,
                            display_name=f"Individual {new_code}",
                            sex="UNKNOWN",
                            approximate_age="Adult",
                            first_seen=img.captured_at,
                            last_seen=img.captured_at,
                            status="ACTIVE",
                            stripe_embedding=cand_emb_str
                        )
                        self.db.add(new_t)
                        self.db.flush()

                        known_tigers_dict.append({
                            "id": new_t.id,
                            "tiger_code": new_t.tiger_code,
                            "display_name": new_t.display_name,
                            "stripe_embedding": new_t.stripe_embedding
                        })

                        cap = TigerCapture(
                            tiger_id=new_t.id,
                            image_id=img.id,
                            station_id=station.id,
                            captured_at=img.captured_at,
                            latitude=station.latitude,
                            longitude=station.longitude,
                            identification_confidence=0.92,
                            identification_method="NEW_INDIVIDUAL",
                            review_status="CONFIRMED"
                        )
                        self.db.add(cap)

                else:
                    img.status = "PROCESSED"

            self.db.commit()

        # Update run completion metrics
        elapsed = round(time.time() - start_time, 2)
        run.completed_at = datetime.datetime.utcnow()
        run.blank_images = blank_cnt
        run.retained_images = retained_cnt
        run.tiger_images = tiger_cnt
        run.new_tigers = new_tiger_cnt
        run.reviewed_images = review_cnt
        run.processing_time = elapsed
        run.storage_saved = round(storage_saved_mb, 2)
        run.status = "COMPLETED_WITH_REVIEW" if review_cnt > 0 else "COMPLETED"

        # Update Occupancy Statistics for active tigers
        self._update_all_tiger_occupancies(run.id)

        self.db.commit()

    def _update_all_tiger_occupancies(self, run_id: int):
        """Recalculates activity centroids and convex hull occupied areas for all tigers."""
        tigers = self.db.query(Tiger).all()
        for t in tigers:
            captures = self.db.query(TigerCapture).filter(TigerCapture.tiger_id == t.id).all()
            if not captures:
                continue
            
            pts = [(c.latitude, c.longitude) for c in captures]
            c_lat, c_lon = SpatialEngine.calculate_centroid(pts)
            occ_area = SpatialEngine.calculate_occupied_area(pts)
            stn_count = len(set(c.station_id for c in captures))

            # Store area statistics record
            stats = TigerAreaStatistics(
                tiger_id=t.id,
                processing_run_id=run_id,
                capture_station_count=stn_count,
                centroid_latitude=c_lat,
                centroid_longitude=c_lon,
                occupied_area_sq_km=occ_area,
                core_area_sq_km=round(occ_area * 0.7, 2),
                buffer_area_sq_km=round(occ_area * 0.3, 2),
                calculated_at=datetime.datetime.utcnow()
            )
            self.db.add(stats)
