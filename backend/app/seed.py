import datetime
import json
from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.station import CameraStation
from app.models.tiger import Tiger, TigerCapture, TigerMovementObservation, TigerAreaStatistics
from app.models.image import Image
from app.models.run import ProcessingRun
from app.models.alert import Alert
from app.ml.stripe_matcher import StripeMatcher
from app.gis.spatial_engine import SpatialEngine

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check and seed missing users & officers
    print("Seeding Pench Tiger Reserve Officers & Demonstration Database...")

    # 1. Users
    users = [
        User(employee_id="FD001", name="Officer Alpha", role="FOREST_OFFICER", department="Pench Wildlife Division", shift="DAY", password_hash="officer123", is_active=True),
        User(employee_id="FD002", name="Officer Beta", role="REVIEWER", department="Triage & Image Review Cell", shift="DAY", password_hash="officer123", is_active=True),
        User(employee_id="FD003", name="Officer Gamma", role="FIELD_STAFF", department="Karmajhiri Range Patrol", shift="NIGHT", password_hash="officer123", is_active=True),
        User(employee_id="ADMIN01", name="Administrator", role="ADMIN", department="IT & Wildlife Intelligence", shift="24X7", password_hash="admin123", is_active=True)
    ]
    for u in users:
        if not db.query(User).filter(User.employee_id == u.employee_id).first():
            db.add(u)
    db.commit()

    # 1B. 10 DEMO Forest Department Officers
    from app.models.officer import Officer
    from app.utils.hash_utils import hash_password

    demo_officers = [
        ("FRO001", "Amit Sharma", "Forest Range Officer", "Forest@123", "Morning", "06:00", "14:00", "Range Office A", "Active"),
        ("FRO002", "Neha Patil", "Assistant Forest Officer", "Tiger@456", "Evening", "14:00", "22:00", "Monitoring Center", "Active"),
        ("FRO003", "Rahul Verma", "Forest Guard Supervisor", "Pench@789", "Night", "22:00", "06:00", "Patrol Zone A", "Active"),
        ("FRO004", "Priya Deshmukh", "Forest Guard", "Forest#234", "Morning", "06:00", "14:00", "Camera Zone 01", "Active"),
        ("FRO005", "Vikram Singh", "Forest Guard", "Tiger#567", "Evening", "14:00", "22:00", "Camera Zone 02", "Active"),
        ("FRO006", "Sneha Joshi", "Wildlife Inspector", "Wild@890", "Night", "22:00", "06:00", "Monitoring Center", "Active"),
        ("FRO007", "Arjun Pawar", "Forest Guard", "Pench#345", "Morning", "06:00", "14:00", "Camera Zone 03", "Active"),
        ("FRO008", "Kavita Rao", "Forest Guard", "Forest#678", "Evening", "14:00", "22:00", "Patrol Zone B", "Active"),
        ("FRO009", "Rohan Kulkarni", "Wildlife Inspector", "Tiger@901", "Night", "22:00", "06:00", "Camera Zone 04", "Active"),
        ("FRO010", "Meena Thakur", "Assistant Forest Officer", "Wild#123", "Morning", "06:00", "14:00", "Range Office B", "Active"),
    ]

    for off_id, name, desig, plain_pass, shift, s_start, s_end, loc, status in demo_officers:
        existing = db.query(Officer).filter(Officer.officer_id == off_id).first()
        if not existing:
            off_obj = Officer(
                officer_id=off_id,
                name=name,
                designation=desig,
                password_hash=hash_password(plain_pass),
                shift=shift,
                shift_start=s_start,
                shift_end=s_end,
                duty_location=loc,
                status=status
            )
            db.add(off_obj)
    db.commit()

    # 2. Camera Stations (Pench Tiger Reserve coordinates ~ 21.65 N, 79.30 E)
    stations = [
        CameraStation(station_code="STN-C01", station_name="Karmajhiri Stream North", latitude=21.6720, longitude=79.3150, zone="Karmajhiri Range", region_type="CORE", status="ACTIVE"),
        CameraStation(station_code="STN-C02", station_name="Touria Waterhole West", latitude=21.6450, longitude=79.2840, zone="Touria Range", region_type="CORE", status="ACTIVE"),
        CameraStation(station_code="STN-C03", station_name="Mahadev Ghat Ridge", latitude=21.6910, longitude=79.3320, zone="Karmajhiri Range", region_type="CORE", status="ACTIVE"),
        CameraStation(station_code="STN-C04", station_name="Gumtara Meadow Central", latitude=21.6280, longitude=79.3450, zone="Gumtara Range", region_type="CORE", status="ACTIVE"),
        CameraStation(station_code="STN-B01", station_name="Khawasa Buffer Checkpost", latitude=21.5890, longitude=79.2510, zone="Khawasa Buffer", region_type="BUFFER", status="ACTIVE"),
        CameraStation(station_code="STN-B02", station_name="Rukhad Buffer Corridor", latitude=21.7250, longitude=79.3800, zone="Rukhad Buffer", region_type="BUFFER", status="ACTIVE"),
        CameraStation(station_code="STN-V01", station_name="Kohka Village Fringe", latitude=21.5720, longitude=79.2280, zone="Fringe Corridor", region_type="VILLAGE_ADJACENT", status="ACTIVE"),
        CameraStation(station_code="STN-V02", station_name="Awarghani Village Border", latitude=21.6110, longitude=79.2150, zone="Fringe Corridor", region_type="VILLAGE_ADJACENT", status="ACTIVE"),
    ]
    db.add_all(stations)
    db.commit()

    matcher = StripeMatcher()

    # 3. Known Tigers
    tigers_data = [
        ("TIGER-001", "T-101 (Collarwali Descendant)", "FEMALE", "Adult (6 yrs)", "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=500"),
        ("TIGER-002", "T-102 (Chhota Male)", "MALE", "Adult (7 yrs)", "https://images.unsplash.com/photo-1549366021-9f761d450615?w=500"),
        ("TIGER-003", "T-103 (Baghini Female)", "FEMALE", "Adult (5 yrs)", "https://images.unsplash.com/photo-1508814437933-f0c7d18a9217?w=500"),
        ("TIGER-004", "T-104 (Rukhad Dominant Male)", "MALE", "Senior (9 yrs)", "https://images.unsplash.com/photo-1575550959106-5a7defe28b56?w=500"),
        ("TIGER-005", "T-105 (Karmajhiri Sub-Adult)", "MALE", "Sub-adult (3 yrs)", "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=500")
    ]

    tiger_objs = []
    now = datetime.datetime.utcnow()
    for code, name, sex, age, img_url in tigers_data:
        emb = matcher.generate_embedding(code)
        t = Tiger(
            tiger_code=code,
            display_name=name,
            sex=sex,
            approximate_age=age,
            first_seen=now - datetime.timedelta(days=180),
            last_seen=now - datetime.timedelta(hours=6),
            status="ACTIVE",
            stripe_embedding=json.dumps(emb),
            profile_image_url=img_url
        )
        db.add(t)
        tiger_objs.append(t)
    db.commit()

    # 4. Processing Run
    run = ProcessingRun(
        started_at=now - datetime.timedelta(hours=2),
        completed_at=now - datetime.timedelta(hours=1, minutes=40),
        total_images=1250,
        blank_images=840,
        retained_images=410,
        tiger_images=132,
        new_tigers=1,
        reviewed_images=4,
        processing_time=124.5,
        storage_saved=2688.0, # MB saved
        status="COMPLETED_WITH_REVIEW"
    )
    db.add(run)
    db.commit()

    # 5. Captures and Movement History
    stn_c01 = stations[0]
    stn_c02 = stations[1]
    stn_c03 = stations[2]
    stn_b01 = stations[4]
    stn_v01 = stations[6]

    captures = [
        # T-101 captures
        TigerCapture(tiger_id=tiger_objs[0].id, image_id=1, station_id=stn_c01.id, captured_at=now - datetime.timedelta(days=2), latitude=stn_c01.latitude, longitude=stn_c01.longitude, identification_confidence=0.96, identification_method="AI_MATCH", review_status="CONFIRMED"),
        TigerCapture(tiger_id=tiger_objs[0].id, image_id=2, station_id=stn_c02.id, captured_at=now - datetime.timedelta(days=1), latitude=stn_c02.latitude, longitude=stn_c02.longitude, identification_confidence=0.94, identification_method="AI_MATCH", review_status="CONFIRMED"),
        TigerCapture(tiger_id=tiger_objs[0].id, image_id=3, station_id=stn_c03.id, captured_at=now - datetime.timedelta(hours=12), latitude=stn_c03.latitude, longitude=stn_c03.longitude, identification_confidence=0.92, identification_method="AI_MATCH", review_status="CONFIRMED"),
        
        # T-102 captures
        TigerCapture(tiger_id=tiger_objs[1].id, image_id=4, station_id=stn_c02.id, captured_at=now - datetime.timedelta(days=3), latitude=stn_c02.latitude, longitude=stn_c02.longitude, identification_confidence=0.91, identification_method="AI_MATCH", review_status="CONFIRMED"),
        TigerCapture(tiger_id=tiger_objs[1].id, image_id=5, station_id=stn_b01.id, captured_at=now - datetime.timedelta(days=1), latitude=stn_b01.latitude, longitude=stn_b01.longitude, identification_confidence=0.88, identification_method="AI_MATCH", review_status="CONFIRMED"),
        TigerCapture(tiger_id=tiger_objs[1].id, image_id=6, station_id=stn_v01.id, captured_at=now - datetime.timedelta(hours=6), latitude=stn_v01.latitude, longitude=stn_v01.longitude, identification_confidence=0.89, identification_method="HUMAN_CONFIRMED", review_status="CONFIRMED"),

        # T-103 captures
        TigerCapture(tiger_id=tiger_objs[2].id, image_id=7, station_id=stn_c03.id, captured_at=now - datetime.timedelta(days=4), latitude=stn_c03.latitude, longitude=stn_c03.longitude, identification_confidence=0.95, identification_method="AI_MATCH", review_status="CONFIRMED"),
    ]
    db.add_all(captures)

    for cap in captures:
        obs = TigerMovementObservation(
            tiger_id=cap.tiger_id,
            station_id=cap.station_id,
            latitude=cap.latitude,
            longitude=cap.longitude,
            timestamp=cap.captured_at,
            confidence=cap.identification_confidence
        )
        db.add(obs)

    # 6. Sample Images
    images_sample = [
        Image(filename="IMG_STN_C01_001.JPG", original_path="./storage/raw/IMG_STN_C01_001.JPG", processed_path="./storage/retained/IMG_STN_C01_001.JPG", station_id=stn_c01.id, captured_at=now - datetime.timedelta(hours=12), file_size=3240500, status="PROCESSED", subject_detected="tiger", subject_type="tiger", detection_confidence=0.96, bounding_box=json.dumps([0.22, 0.18, 0.78, 0.82]), processing_run_id=run.id),
        Image(filename="IMG_STN_V01_042.JPG", original_path="./storage/raw/IMG_STN_V01_042.JPG", processed_path="./storage/retained/IMG_STN_V01_042.JPG", station_id=stn_v01.id, captured_at=now - datetime.timedelta(hours=6), file_size=2980100, status="PROCESSED", subject_detected="tiger", subject_type="tiger", detection_confidence=0.91, bounding_box=json.dumps([0.25, 0.20, 0.80, 0.85]), processing_run_id=run.id),
        Image(filename="IMG_STN_C02_BLK.JPG", original_path="./storage/raw/IMG_STN_C02_BLK.JPG", processed_path="./storage/quarantine/IMG_STN_C02_BLK.JPG", station_id=stn_c02.id, captured_at=now - datetime.timedelta(hours=10), file_size=3120000, status="QUARANTINED", subject_detected="blank", subject_type="blank", detection_confidence=0.94, processing_run_id=run.id),
        Image(filename="IMG_STN_B01_REV.JPG", original_path="./storage/raw/IMG_STN_B01_REV.JPG", processed_path="./storage/retained/IMG_STN_B01_REV.JPG", station_id=stn_b01.id, captured_at=now - datetime.timedelta(hours=4), file_size=3410000, status="REVIEW_REQUIRED", subject_detected="tiger", subject_type="tiger", detection_confidence=0.74, bounding_box=json.dumps([0.30, 0.22, 0.75, 0.80]), processing_run_id=run.id)
    ]
    db.add_all(images_sample)
    db.commit()

    # 7. Sample Alerts
    alerts_sample = [
        Alert(
            tiger_id=tiger_objs[1].id,
            alert_type="VILLAGE_APPROACH",
            severity="CRITICAL",
            title="CRITICAL: T-102 (Chhota Male) Detected Near Kohka Village Border",
            description="Individual T-102 recorded at village-adjacent camera station STN-V01. Distance to village boundary: ~450 meters.",
            detected_change="Movement into human-dominated fringe corridor",
            supporting_evidence=json.dumps({"station_code": "STN-V01", "distance_to_village_m": 450, "region_type": "VILLAGE_ADJACENT", "capture_timestamp": (now - datetime.timedelta(hours=6)).isoformat()}),
            confidence=0.98,
            station_id=stn_v01.id,
            is_artefact="NO",
            status="ACTIVE"
        ),
        Alert(
            tiger_id=tiger_objs[0].id,
            alert_type="RANGE_SHIFT",
            severity="HIGH",
            title="Significant Territory Shift for T-101 (Collarwali Descendant)",
            description="Activity centroid shifted by 8.4 km North toward Mahadev Ghat Ridge from historical core territory.",
            detected_change="Centroid displacement of 8.4 km",
            supporting_evidence=json.dumps({"shift_distance_km": 8.4, "previous_centroid": [21.6450, 79.2840], "new_centroid": [21.6910, 79.3320]}),
            confidence=0.92,
            station_id=stn_c03.id,
            is_artefact="NO",
            status="ACTIVE"
        ),
        Alert(
            tiger_id=tiger_objs[3].id,
            alert_type="DATA_ARTIFACT",
            severity="LOW",
            title="Absence Flagged as Survey Artefact for T-104 (Rukhad Dominant Male)",
            description="No sightings for 34 days, but camera station STN-B02 was offline for 22 days due to battery drainage.",
            detected_change="Apparent absence of 34 days (Equipment Downtime)",
            supporting_evidence=json.dumps({"days_absent": 34, "station_downtime_days": 22, "conclusion": "High probability of survey artefact due to camera station downtime."}),
            confidence=0.86,
            station_id=stations[5].id,
            is_artefact="YES",
            status="ACTIVE"
        )
    ]
    db.add_all(alerts_sample)
    db.commit()

    # 8. Calculate Area Statistics
    for t in tiger_objs:
        t_caps = db.query(TigerCapture).filter(TigerCapture.tiger_id == t.id).all()
        if t_caps:
            pts = [(c.latitude, c.longitude) for c in t_caps]
            c_lat, c_lon = SpatialEngine.calculate_centroid(pts)
            occ_area = SpatialEngine.calculate_occupied_area(pts)
            stat = TigerAreaStatistics(
                tiger_id=t.id,
                processing_run_id=run.id,
                capture_station_count=len(set(c.station_id for c in t_caps)),
                centroid_latitude=c_lat,
                centroid_longitude=c_lon,
                occupied_area_sq_km=occ_area,
                core_area_sq_km=round(occ_area * 0.7, 2),
                buffer_area_sq_km=round(occ_area * 0.3, 2)
            )
            db.add(stat)
    db.commit()

    print("Seeding completed successfully! Default Login Credentials:")
    print("  Officer Alpha (Forest Officer): FD001 / officer123")
    print("  Administrator: ADMIN01 / admin123")

    db.close()

if __name__ == "__main__":
    seed_database()
