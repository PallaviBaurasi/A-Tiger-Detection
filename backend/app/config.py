import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Pench Vission - Camera Trap Triage & Intelligence System"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pench_wildlife.db")
    
    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "pench_reserve_secret_key_2026_super_secure")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
    
    # File Storage Paths
    STORAGE_PATH: str = os.getenv("STORAGE_PATH", "./storage")
    RAW_PATH: str = os.path.join(STORAGE_PATH, "raw")
    RETAINED_PATH: str = os.path.join(STORAGE_PATH, "retained")
    QUARANTINE_PATH: str = os.path.join(STORAGE_PATH, "quarantine")
    PROCESSED_PATH: str = os.path.join(STORAGE_PATH, "processed")
    THUMBNAILS_PATH: str = os.path.join(STORAGE_PATH, "thumbnails")
    
    # Roboflow Model Integration
    ROBOFLOW_API_KEY: str = os.getenv("ROBOFLOW_API_KEY", "0v1CV9RCwFowx4emofXx")
    ROBOFLOW_MODEL_ID: str = os.getenv("ROBOFLOW_MODEL_ID", "find-tiger-hdm2r")
    ROBOFLOW_VERSION: str = os.getenv("ROBOFLOW_VERSION", "1")
    
    # ML & Triage Thresholds
    ML_MODE: str = os.getenv("ML_MODE", "roboflow") # "demo", "production", or "roboflow"
    BLANK_THRESHOLD: float = float(os.getenv("BLANK_THRESHOLD", "0.90")) # >= 0.90 auto quarantine
    MATCH_THRESHOLD: float = float(os.getenv("MATCH_THRESHOLD", "0.85")) # >= 0.85 auto match tiger
    REVIEW_THRESHOLD: float = float(os.getenv("REVIEW_THRESHOLD", "0.65")) # 0.65 - 0.85 human review
    
    # GIS & Movement Thresholds
    CORE_RANGE_THRESHOLD: float = float(os.getenv("CORE_RANGE_THRESHOLD", "15.0"))
    BUFFER_RANGE_THRESHOLD: float = float(os.getenv("BUFFER_RANGE_THRESHOLD", "5.0"))
    PROLONGED_ABSENCE_DAYS: int = int(os.getenv("PROLONGED_ABSENCE_DAYS", "30"))

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
for path in [settings.STORAGE_PATH, settings.RAW_PATH, settings.RETAINED_PATH, 
            settings.QUARANTINE_PATH, settings.PROCESSED_PATH, settings.THUMBNAILS_PATH]:
    os.makedirs(path, exist_ok=True)
