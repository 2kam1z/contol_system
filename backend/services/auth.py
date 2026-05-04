from pwdlib import PasswordHash
from datetime import datetime, timedelta, UTC
from jose import jwt
from backend.core.config import SECRET_KEY, ALGORITHM, REFRESH_TOKEN_EXPIRE_DAYS

password_hash = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return password_hash.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)

def create_token(data: dict) -> str:
    payload = data.copy()
    payload.update({
        "exp": datetime.now(UTC) + timedelta(hours=1),
    })
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    payload = data.copy()
    payload.update({
        "exp": datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    })
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])