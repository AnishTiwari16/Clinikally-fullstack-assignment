from flask import jsonify
from db.index import db_pool
from helpers.index import get_internal_user_id

def get_sessions():
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
            SELECT id, created_at
            FROM chat_sessions
            WHERE user_id = %s
            ORDER BY created_at DESC;
            """,
            (user_id,)
        )
        sessions = cur.fetchall()
        sessions_list = [
            {"id": row[0], "created_at": row[1].isoformat() if row[1] else None}
            for row in sessions
        ]
        return jsonify({"sessions": sessions_list}), 200
    except Exception as e:
        print("❌ Error fetching sessions:", e)
        return jsonify({"error": "Failed to fetch sessions"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            db_pool.putconn(conn)
