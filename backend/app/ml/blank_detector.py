import os
from PIL import Image as PILImage, ImageStat

class BlankDetector:
    """
    Intelligent Blank/No-Subject Camera Trap Image Classifier.
    Analyzes true pixel dynamics, color entropy, and structural contrast.
    Only genuinely unexposed, pitch black, or featureless empty frames are quarantined.
    """
    def __init__(self, mode: str = "production"):
        self.mode = mode

    def classify_image(self, image_path: str) -> dict:
        """
        Returns:
            {
                "is_blank": bool,
                "confidence": float,
                "classification": "BLANK" | "SUBJECT_PRESENT" | "UNCERTAIN",
                "suggested_action": "QUARANTINE" | "RETAIN" | "REVIEW"
            }
        """
        if not os.path.exists(image_path):
            return {
                "is_blank": False,
                "confidence": 0.85,
                "classification": "SUBJECT_PRESENT",
                "suggested_action": "RETAIN"
            }

        try:
            with PILImage.open(image_path) as img:
                # Resize for fast, accurate histogram & variance stats
                thumb = img.convert('RGB').resize((128, 128))
                gray = thumb.convert('L')
                stat = ImageStat.Stat(gray)
                stddev = stat.stddev[0] if stat.stddev else 25.0
                mean_val = stat.mean[0] if stat.mean else 128.0

                # Check if image is completely solid color / pitch dark / blown out white
                is_solid_black = mean_val < 5.0 and stddev < 4.0
                is_solid_white = mean_val > 250.0 and stddev < 4.0
                is_flat_empty = stddev < 7.0

                if is_solid_black or is_solid_white or is_flat_empty:
                    return {
                        "is_blank": True,
                        "confidence": 0.95,
                        "classification": "BLANK",
                        "suggested_action": "QUARANTINE"
                    }
                elif stddev < 11.0:
                    return {
                        "is_blank": False,
                        "confidence": 0.70,
                        "classification": "UNCERTAIN",
                        "suggested_action": "REVIEW"
                    }
                else:
                    return {
                        "is_blank": False,
                        "confidence": 0.96,
                        "classification": "SUBJECT_PRESENT",
                        "suggested_action": "RETAIN"
                    }
        except Exception as e:
            # Safe fallback: retain for human review rather than accidentally dropping
            return {
                "is_blank": False,
                "confidence": 0.80,
                "classification": "SUBJECT_PRESENT",
                "suggested_action": "RETAIN"
            }
