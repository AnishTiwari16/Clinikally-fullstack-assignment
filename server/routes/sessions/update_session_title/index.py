from flask import jsonify, request
from db.index import db_pool
from helpers.index import get_internal_user_id

def update_session_title(session_id):
    user_id = get_internal_user_id()
    if not user_id:
        return jsonify({"error": "User not found"}), 500

    # Get title from request body
    data = request.get_json()
    title = data["title"]
    if not title:
        return jsonify({"error": "Title is required"}), 400

    conn = None
    cur = None
    try:
        conn = db_pool.getconn()
        cur = conn.cursor()
        
        cur.execute(
            """
            UPDATE chat_sessions
            SET title = %s
            WHERE id = %s AND user_id = %s
            RETURNING id, title;
            """,
            (title, session_id, user_id)
        )
        updated_session = cur.fetchone()
        
        if not updated_session:
            return jsonify({"error": "Session not found or access denied"}), 404
        
        conn.commit()
        return jsonify({"session": {"id": updated_session[0], "title": updated_session[1]}}), 200
    except Exception as e:
        print("❌ Error updating session title:", e)
        if conn:
            conn.rollback()
        return jsonify({"error": "Failed to update session title"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            db_pool.putconn(conn)

