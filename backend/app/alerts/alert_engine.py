import json
import datetime
from typing import List, Dict, Any, Optional, Tuple
from app.config import settings
from app.gis.spatial_engine import SpatialEngine

class AlertEngine:
    """
    Dedicated Alert Engine & Survey Artefact Classifier.
    Evaluates new processing run captures against historical baseline behavior.
    Distinguishes genuine biological/behavioral changes from survey artefacts.
    """
    def __init__(self):
        self.range_threshold = settings.CORE_RANGE_THRESHOLD
        self.absence_days = settings.PROLONGED_ABSENCE_DAYS

    def evaluate_new_capture(
        self,
        tiger_id: int,
        tiger_code: str,
        display_name: str,
        station_id: int,
        station_code: str,
        region_type: str,
        captured_at: datetime.datetime,
        historical_stations: List[int],
        previous_centroid: Optional[Tuple[float, float]] = None,
        new_lat: float = 21.65,
        new_lon: float = 79.30
    ) -> List[Dict[str, Any]]:
        """
        Evaluates a new tiger capture event for alerts.
        """
        alerts = []

        # 1. NEW STATION ALERT
        if station_id not in historical_stations:
            alerts.append({
                "tiger_id": tiger_id,
                "alert_type": "NEW_STATION",
                "severity": "MEDIUM",
                "title": f"First Sight of {display_name} ({tiger_code}) at {station_code}",
                "description": f"Individual {tiger_code} recorded at camera station {station_code} for the first time.",
                "detected_change": f"Expansion into new capture station {station_code}",
                "supporting_evidence": json.dumps({
                    "station_code": station_code,
                    "region_type": region_type,
                    "previous_unique_stations_count": len(set(historical_stations)),
                    "first_capture_timestamp": captured_at.isoformat()
                }),
                "confidence": 0.95,
                "station_id": station_id,
                "is_artefact": "NO"
            })

        # 2. VILLAGE APPROACH ALERT
        if region_type == "VILLAGE_ADJACENT":
            alerts.append({
                "tiger_id": tiger_id,
                "alert_type": "VILLAGE_APPROACH",
                "severity": "CRITICAL",
                "title": f"CRITICAL: {display_name} ({tiger_code}) Detected Near Village Boundary",
                "description": f"Tiger detected at village-adjacent station {station_code}. Immediate human-wildlife conflict monitoring advisory.",
                "detected_change": "Movement into human-dominated fringe / village adjacent zone",
                "supporting_evidence": json.dumps({
                    "station_code": station_code,
                    "region_type": region_type,
                    "distance_to_village_m": 450,
                    "capture_timestamp": captured_at.isoformat()
                }),
                "confidence": 0.98,
                "station_id": station_id,
                "is_artefact": "NO"
            })

        # 3. BUFFER MOVEMENT ALERT
        elif region_type == "BUFFER":
            alerts.append({
                "tiger_id": tiger_id,
                "alert_type": "BUFFER_MOVEMENT",
                "severity": "HIGH",
                "title": f"{display_name} ({tiger_code}) Movement in Buffer Area",
                "description": f"Individual recorded at buffer zone camera station {station_code}.",
                "detected_change": "Out-of-core movement trajectory into Pench Buffer Zone",
                "supporting_evidence": json.dumps({
                    "station_code": station_code,
                    "region_type": region_type,
                    "capture_timestamp": captured_at.isoformat()
                }),
                "confidence": 0.92,
                "station_id": station_id,
                "is_artefact": "NO"
            })

        # 4. RANGE SHIFT ALERT
        if previous_centroid:
            shift_dist = SpatialEngine.haversine_distance(
                previous_centroid[0], previous_centroid[1],
                new_lat, new_lon
            )
            if shift_dist >= 8.0:
                alerts.append({
                    "tiger_id": tiger_id,
                    "alert_type": "RANGE_SHIFT",
                    "severity": "HIGH",
                    "title": f"Significant Territory Shift for {display_name} ({tiger_code})",
                    "description": f"Activity centroid shifted by {round(shift_dist, 2)} km from previous home range center.",
                    "detected_change": f"Spatial centroid displacement of {round(shift_dist, 2)} km",
                    "supporting_evidence": json.dumps({
                        "previous_centroid": previous_centroid,
                        "new_centroid": (new_lat, new_lon),
                        "shift_distance_km": round(shift_dist, 2),
                        "threshold_km": 8.0
                    }),
                    "confidence": 0.89,
                    "station_id": station_id,
                    "is_artefact": "NO"
                })

        return alerts

    def evaluate_absence(
        self,
        tiger_id: int,
        tiger_code: str,
        display_name: str,
        last_seen: datetime.datetime,
        station_downtime_days: int = 0,
        active_camera_count: int = 24
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluates prolonged absence while explicitly checking for survey artefacts (camera downtime).
        """
        days_absent = (datetime.datetime.utcnow() - last_seen).days

        if days_absent >= self.absence_days:
            # Check if camera station downtime explains the absence (Survey Artefact)
            if station_downtime_days > 15 or active_camera_count < 5:
                return {
                    "tiger_id": tiger_id,
                    "alert_type": "DATA_ARTIFACT",
                    "severity": "LOW",
                    "title": f"Absence of {display_name} ({tiger_code}) - Survey Artefact Flagged",
                    "description": f"Tiger absent for {days_absent} days, but camera station downtime ({station_downtime_days} days) or reduced survey effort accounts for missing sightings.",
                    "detected_change": f"Apparent absence of {days_absent} days (Artefact)",
                    "supporting_evidence": json.dumps({
                        "days_absent": days_absent,
                        "station_downtime_days": station_downtime_days,
                        "active_camera_count": active_camera_count,
                        "conclusion": "High probability of survey artefact due to equipment downtime."
                    }),
                    "confidence": 0.85,
                    "is_artefact": "YES"
                }
            else:
                return {
                    "tiger_id": tiger_id,
                    "alert_type": "PROLONGED_ABSENCE",
                    "severity": "HIGH",
                    "title": f"Prolonged Absence Warning: {display_name} ({tiger_code})",
                    "description": f"No captures recorded for {days_absent} days despite active camera station coverage.",
                    "detected_change": f"No sightings recorded for {days_absent} consecutive days",
                    "supporting_evidence": json.dumps({
                        "days_absent": days_absent,
                        "last_seen": last_seen.isoformat(),
                        "survey_effort": "OPERATIONAL",
                        "conclusion": "Potential territorial displacement, dispersal, or mortality risk."
                    }),
                    "confidence": 0.90,
                    "is_artefact": "NO"
                }
        return None
