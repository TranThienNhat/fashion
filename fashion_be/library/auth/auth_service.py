import os
import datetime
import hashlib
import functools
from flask import request, jsonify, g
import jwt
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "fashion_secret_jwt_key_2026_xyz_super_secure")


def hash_password(password: str) -> str:
    """Mã hóa mật khẩu với SHA-256 + salt để đảm bảo an toàn và tính tương thích cao."""
    salt = "fashion_salt_secure_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password


def generate_token(user: dict) -> str:
    """Tạo JWT token có hiệu lực 7 ngày."""
    payload = {
        "user_id": user["user_id"],
        "email": user["email"],
        "role": user["role"],
        "full_name": user.get("full_name", ""),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])


from library.common.response import api_error


def token_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return api_error("Thiếu Authorization header", code="AUTH_HEADER_MISSING", status=401)
        try:
            token = auth_header.split(" ")[1] if " " in auth_header else auth_header
            payload = decode_token(token)
            g.current_user = payload
        except jwt.ExpiredSignatureError:
            return api_error("Token đã hết hạn", code="AUTH_TOKEN_EXPIRED", status=401)
        except Exception as e:
            return api_error(f"Token không hợp lệ: {str(e)}", code="AUTH_TOKEN_INVALID", status=401)
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return api_error("Thiếu Authorization header", code="AUTH_HEADER_MISSING", status=401)
        try:
            token = auth_header.split(" ")[1] if " " in auth_header else auth_header
            payload = decode_token(token)
            if payload.get("role") not in ["ADMIN", "STAFF"]:
                return api_error("Bạn không có quyền quản trị", code="AUTH_FORBIDDEN", status=403)
            g.current_user = payload
        except Exception as e:
            return api_error(f"Lỗi xác thực: {str(e)}", code="AUTH_UNAUTHORIZED", status=401)
        return f(*args, **kwargs)
    return decorated
