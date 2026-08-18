import hmac
import hashlib
import json
import base64
import datetime
from app.config import settings

def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def _b64_decode(data_str: str) -> bytes:
    padding = '=' * (4 - (len(data_str) % 4))
    return base64.urlsafe_b64decode(data_str + padding)

def encode_jwt(payload: dict, secret: str = settings.JWT_SECRET, algorithm: str = settings.JWT_ALGORITHM) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _b64_encode(json.dumps(header).encode('utf-8'))
    
    # Ensure expiration
    if "exp" not in payload:
        exp = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload["exp"] = int(exp.timestamp())
    elif isinstance(payload["exp"], datetime.datetime):
        payload["exp"] = int(payload["exp"].timestamp())

    payload_b64 = _b64_encode(json.dumps(payload).encode('utf-8'))
    
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(secret.encode('utf-8'), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_jwt(token: str, secret: str = settings.JWT_SECRET, algorithms: list = None) -> dict:
    parts = token.split('.')
    if len(parts) != 3:
        raise ValueError("Invalid token structure")

    header_b64, payload_b64, sig_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    expected_sig = hmac.new(secret.encode('utf-8'), signing_input, hashlib.sha256).digest()
    
    actual_sig = _b64_decode(sig_b64)
    if not hmac.compare_digest(actual_sig, expected_sig):
        raise ValueError("Signature verification failed")

    payload = json.loads(_b64_decode(payload_b64).decode('utf-8'))
    
    if "exp" in payload and payload["exp"] < int(datetime.datetime.utcnow().timestamp()):
        raise ValueError("Token has expired")

    return payload
