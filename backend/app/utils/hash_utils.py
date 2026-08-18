import hashlib
import os
import hmac

def hash_password(password: str) -> str:
    """
    Hashes a password using PBKDF2 HMAC SHA-256 with a random salt.
    Format: pbkdf2:sha256:100000$salt_hex$hash_hex
    """
    salt = os.urandom(16)
    iterations = 100000
    derived = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
    return f"pbkdf2:sha256:{iterations}${salt.hex()}${derived.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against a stored PBKDF2 hash.
    Also supports fallback for legacy demo plain text hashes.
    """
    if not hashed_password:
        return False
        
    # Support PBKDF2 hashes
    if hashed_password.startswith("pbkdf2:sha256:"):
        try:
            parts = hashed_password.split("$")
            if len(parts) != 3:
                return False
            iterations = int(parts[0].split(":")[2])
            salt = bytes.fromhex(parts[1])
            expected_hash = bytes.fromhex(parts[2])
            derived = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, iterations)
            return hmac.compare_digest(derived, expected_hash)
        except Exception as e:
            print(f"[Hash Verification Error] {e}")
            return False

    # Support legacy simple hash formats or exact match fallback for demo testing
    return plain_password == hashed_password or hashed_password == f"hashed_{plain_password}"
