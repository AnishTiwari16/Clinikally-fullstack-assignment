from flask import jsonify
from db.index import db_pool
from helpers.index import get_internal_user_id

def add_session():
    user_id = get_internal_user_id()
    if not user_id:
        return jsonify({"error": "User not found"}), 500

    conn = None
    cur = None
    try:
        conn = db_pool.getconn()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO chat_sessions (user_id)
            VALUES (%s)
            RETURNING id, created_at;
            """,
            (user_id,)
        )
        session = cur.fetchone()  
        conn.commit()
        return jsonify({ "session": {"id": session[0], "created_at": session[1]}}), 200
    except Exception as e:
        print("❌ Error fetching user details:", e)
        return jsonify({"error": "Failed to fetch user details"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            db_pool.putconn(conn)
