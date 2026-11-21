import os
import json
import hmac
import hashlib
import base64
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv

from database import get_supabase

# Load environment from backend/.env or root .env
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-for-postblogs-app-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://nqgtjapaarsrhumfprfc.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# In-memory token cache for verified external tokens: token -> {"payload": dict, "exp": float}
_token_cache = {}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# --- Zero-dependency secure password hashing (PBKDF2-HMAC-SHA256) ---
def get_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"pbkdf2_sha256${salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if hashed_password.startswith("pbkdf2_sha256$"):
        try:
            parts = hashed_password.split("$")
            if len(parts) == 3:
                salt, stored_hash = parts[1], parts[2]
                computed = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100_000)
                return secrets.compare_digest(computed.hex(), stored_hash)
        except Exception:
            return False

    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


# --- Zero-dependency RFC 7519 standard JWT implementation ---
def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")

def _b64url_decode(data: str) -> bytes:
    rem = len(data) % 4
    if rem > 0:
        data += "=" * (4 - rem)
    return base64.urlsafe_b64decode(data.encode("utf-8"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire.timestamp()})
    
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(to_encode, default=str, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    sig = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64url_encode(sig)
    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT token structure")

    header_b64, payload_b64, sig_b64 = parts
    try:
        payload_json = _b64url_decode(payload_b64).decode("utf-8")
        payload = json.loads(payload_json)
    except Exception:
        raise ValueError("Corrupt JWT payload")

    # 1. Supabase JWT handling
    iss = payload.get("iss", "")
    if "supabase" in iss or (SUPABASE_URL and SUPABASE_URL in iss):
        exp_ts = payload.get("exp")
        if exp_ts and datetime.utcnow().timestamp() > exp_ts:
            raise ValueError("Token expired")

        email = payload.get("email")
        sub = payload.get("sub")
        if not sub and not email:
            raise ValueError("Invalid Supabase token claims")

        now = datetime.utcnow().timestamp()
        if token in _token_cache and _token_cache[token]["exp"] > now:
            return _token_cache[token]["payload"]

        api_key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
        if api_key and SUPABASE_URL:
            try:
                import urllib.request
                req = urllib.request.Request(
                    f"{SUPABASE_URL.rstrip('/')}/auth/v1/user",
                    headers={
                        "apikey": api_key,
                        "Authorization": f"Bearer {token}"
                    }
                )
                with urllib.request.urlopen(req, timeout=3) as resp:
                    if resp.status == 200:
                        sb_user = json.loads(resp.read().decode("utf-8"))
                        payload["email"] = sb_user.get("email", email)
                        payload["sub"] = sb_user.get("id", sub)
                        if "user_metadata" in sb_user:
                            payload["user_metadata"] = sb_user["user_metadata"]
            except Exception:
                pass

        _token_cache[token] = {
            "payload": payload,
            "exp": exp_ts or (now + 3600)
        }
        return payload

    # 2. Local JWT handling
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    
    try:
        actual_sig = _b64url_decode(sig_b64)
    except Exception:
        raise ValueError("Corrupt signature in token")

    if not hmac.compare_digest(expected_sig, actual_sig):
        raise ValueError("Invalid token signature")

    if "exp" in payload:
        exp_ts = payload["exp"]
        if isinstance(exp_ts, (int, float)) and datetime.utcnow().timestamp() > exp_ts:
            raise ValueError("Token expired")

    return payload


# STICK WITH SUPABASE ONLY: Use public.profiles table
def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        if not user_id and not email:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    profile = None
    try:
        sb = get_supabase()
        if user_id:
            res = sb.table("profiles").select("*").eq("id", user_id).execute()
            if res.data and len(res.data) > 0:
                profile = res.data[0]
        if not profile and email:
            res = sb.table("profiles").select("*").eq("email", email).execute()
            if res.data and len(res.data) > 0:
                profile = res.data[0]
    except Exception as e:
        print(f"Supabase profile lookup note: {e}")

    # Fallback to token payload claims if Supabase profile read had network jitter
    if not profile and (user_id or email):
        is_sole_admin = (email and email.lower() == "pavan@kalagawealth.com")
        role = "admin" if is_sole_admin else "client"
        meta = payload.get("user_metadata", {})
        profile = {
            "id": user_id or str(secrets.token_hex(16)),
            "email": email or "",
            "full_name": meta.get("full_name") or ("Kalaga Pavan Kishore" if is_sole_admin else (email.split("@")[0] if email else "User")),
            "role": role,
            "avatar_url": meta.get("avatar_url") or f"https://api.dicebear.com/7.x/avataaars/svg?seed={email or 'user'}"
        }

    if not profile:
        raise credentials_exception

    # Strictly enforce Kalaga Pavan Kishore as the sole administrator
    clean_email = profile.get("email", "").lower()
    meta = payload.get("user_metadata", {})
    if clean_email == "pavan@kalagawealth.com":
        profile["role"] = "admin"
        profile["membership_status"] = "active"
        profile["membership_expires_at"] = None
        profile["last_payment_utr"] = None
    else:
        profile["role"] = "client"
        profile["membership_status"] = profile.get("membership_status") or meta.get("membership_status") or "unpaid"
        profile["membership_expires_at"] = profile.get("membership_expires_at") or meta.get("membership_expires_at")
        profile["last_payment_utr"] = profile.get("last_payment_utr") or meta.get("last_payment_utr")

        # Check for expiration
        if profile["membership_status"] == "active" and profile.get("membership_expires_at"):
            try:
                exp_dt = datetime.fromisoformat(str(profile["membership_expires_at"]).replace("Z", "+00:00"))
                if datetime.utcnow().timestamp() > exp_dt.timestamp():
                    profile["membership_status"] = "expired"
            except Exception:
                pass

    return profile


def get_optional_current_user(
    token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False))
) -> Optional[dict]:
    if not token:
        return None
    try:
        return get_current_user(token=token)
    except Exception:
        return None


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admin privileges required to perform this action."
        )
    return current_user


def require_client_or_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") not in ["client", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Valid client or admin role required."
        )
    return current_user
