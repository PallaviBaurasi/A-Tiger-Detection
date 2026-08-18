import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.seed import seed_database
from app.models import User, CameraStation, Tiger, Alert, Image, ProcessingRun
from app.ml.blank_detector import BlankDetector
from app.ml.tiger_detector import TigerDetector
from app.ml.stripe_matcher import StripeMatcher
from app.gis.spatial_engine import SpatialEngine
from app.alerts.alert_engine import AlertEngine

def test_backend_integrity():
    print("--- 1. Testing Database & Seed ---")
    Base.metadata.create_all(bind=engine)
    seed_database()
    
    db = SessionLocal()
    users_count = db.query(User).count()
    stations_count = db.query(CameraStation).count()
    tigers_count = db.query(Tiger).count()
    alerts_count = db.query(Alert).count()
    images_count = db.query(Image).count()

    print(f"Users: {users_count}")
    print(f"Camera Stations: {stations_count}")
    print(f"Tigers: {tigers_count}")
    print(f"Alerts: {alerts_count}")
    print(f"Images: {images_count}")
    
    assert users_count >= 4, "Users seed failed"
    assert stations_count >= 8, "Stations seed failed"
    assert tigers_count >= 5, "Tigers seed failed"

    print("--- 2. Testing ML Modules ---")
    bd = BlankDetector(mode="demo")
    res_b = bd.classify_image("sample_test.jpg")
    print("BlankDetector output:", res_b)

    td = TigerDetector(mode="demo")
    res_t = td.detect_subject("sample_tiger.jpg")
    print("TigerDetector output:", res_t)

    sm = StripeMatcher(mode="demo")
    emb = sm.generate_embedding("sample_tiger.jpg")
    print(f"StripeMatcher embedding length: {len(emb)}")

    print("--- 3. Testing GIS Spatial Engine ---")
    pts = [(21.67, 79.31), (21.64, 79.28), (21.69, 79.33)]
    c = SpatialEngine.calculate_centroid(pts)
    area = SpatialEngine.calculate_occupied_area(pts)
    print(f"Centroid: {c}, Occupied Area: {area} km²")

    print("--- 4. Testing Alert Engine ---")
    ae = AlertEngine()
    alerts = ae.evaluate_new_capture(
        tiger_id=1, tiger_code="TIGER-001", display_name="T-101",
        station_id=7, station_code="STN-V01", region_type="VILLAGE_ADJACENT",
        captured_at=db.query(Tiger).first().last_seen,
        historical_stations=[1, 2, 3]
    )
    print(f"Generated Alerts Count: {len(alerts)}")

    db.close()
    print("=== BACKEND INTEGRITY TEST PASSED ===")

if __name__ == "__main__":
    test_backend_integrity()
