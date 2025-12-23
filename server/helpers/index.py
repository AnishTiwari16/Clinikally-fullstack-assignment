from datetime import datetime, timedelta, timezone
from flask import g, request
from db.index import db_pool
import jwt
import os

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
def generate_session_token(email):
    now = datetime.now(timezone.utc)

    access_payload = {
        "email": email,
        "type": "access",
        "exp": now + timedelta(hours=1),
        "iat": now
    }

    refresh_payload = {
        "email": email,
        "type": "refresh",
        "exp": now + timedelta(days=7),
        "iat": now
    }
    access_token = jwt.encode(access_payload, SECRET_KEY, algorithm="HS256")
    refresh_token = jwt.encode(refresh_payload, SECRET_KEY, algorithm="HS256")

    return access_token, refresh_token

def get_internal_user_id():
    conn = None
    cur = None
    try:
        conn = db_pool.getconn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM users_info WHERE email = %s;", (g.user['email'],))
        row = cur.fetchone()
        if row:
            return row[0]
        else:
            raise ValueError("User not found")
    except Exception as e:
        print("❌ Failed to fetch user ID:", e)
        return None
    finally:
        if cur:
            cur.close()
        if conn:
            db_pool.putconn(conn)

def get_api_key_limiter():
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    return auth.split("Bearer ")[1]

def add_message(session_id, role, content):
    conn = db_pool.getconn()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO chat_messages (session_id, role, content)
            VALUES (%s, %s, %s)
            """,
            (session_id, role, content)
        )
        conn.commit()
    finally:
        cur.close()
        db_pool.putconn(conn)


def get_or_create_session(user_id, session_id=None):
    conn = db_pool.getconn()
    cur = conn.cursor()
    try:
        # If session_id provided → validate ownership
        if session_id:
            cur.execute(
                """
                SELECT id FROM chat_sessions
                WHERE id = %s AND user_id = %s
                """,
                (session_id, user_id)
            )
            row = cur.fetchone()
            if row:
                return session_id

        # Else create a new session
        cur.execute(
            """
            INSERT INTO chat_sessions (user_id)
            VALUES (%s)
            RETURNING id
            """,
            (user_id,)
        )
        new_session_id = cur.fetchone()[0]
        is_first_chat = True
        conn.commit()
        return new_session_id, is_first_chat
    finally:
        cur.close()
        db_pool.putconn(conn)