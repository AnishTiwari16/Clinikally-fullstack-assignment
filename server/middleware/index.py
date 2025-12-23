
from functools import wraps
from flask import  request, jsonify, g
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
import jwt

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
SECRET_KEY = os.getenv("JWT_SECRET_KEY")

def require_google_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or malformed Authorization header"}), 401

        token = auth_header.split("Bearer ")[1]
        try:
            id_info = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                GOOGLE_CLIENT_ID 
            )
        except ValueError as e:
            return jsonify({"error": "Invalid ID token", "details": str(e)}), 401
        g.user = {
            "email": id_info.get("email"),
            "picture" : id_info.get("picture") or None
        }
        return f(*args, **kwargs)
    return decorated_function

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or malformed Authorization header"}), 401

        token = auth_header.split("Bearer ")[1]
       

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms="HS256")
            if payload.get("type") != "access":
                return jsonify({"error": "Invalid token type"}), 401
            g.user = {"email": payload["email"]}
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 403
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)
    return decorated_function