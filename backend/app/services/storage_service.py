import os
import shutil
from PIL import Image as PILImage
from app.config import settings

class StorageService:
    """
    Abstractions for local filesystem storage (scalable to AWS S3 / GCS).
    Manages raw, retained, quarantine, processed, and thumbnail directories.
    """
    @staticmethod
    def save_raw_image(file_bytes: bytes, filename: str) -> str:
        dest_path = os.path.join(settings.RAW_PATH, filename)
        with open(dest_path, "wb") as f:
            f.write(file_bytes)
        
        # Generate thumbnail
        StorageService.generate_thumbnail(dest_path, filename)
        return dest_path

    @staticmethod
    def quarantine_image(original_path: str, filename: str) -> str:
        """Safely moves blank image to quarantine without deleting."""
        dest_path = os.path.join(settings.QUARANTINE_PATH, filename)
        if os.path.exists(original_path):
            shutil.copy2(original_path, dest_path)
        return dest_path

    @staticmethod
    def retain_image(original_path: str, filename: str) -> str:
        """Moves non-blank image to retained folder for processing."""
        dest_path = os.path.join(settings.RETAINED_PATH, filename)
        if os.path.exists(original_path):
            shutil.copy2(original_path, dest_path)
        return dest_path

    @staticmethod
    def generate_thumbnail(image_path: str, filename: str) -> str:
        thumb_path = os.path.join(settings.THUMBNAILS_PATH, filename)
        try:
            if os.path.exists(image_path):
                with PILImage.open(image_path) as img:
                    img.thumbnail((300, 300))
                    img.save(thumb_path)
        except Exception:
            pass
        return thumb_path
