from flask import jsonify
from db.index import db_pool
from helpers.index import get_internal_user_id
def user_info():
    user_id = get_internal_user_id()
    if not user_id:
        return jsonify({"error": "User not found"}), 500
    conn = None
    cur = None
    try:
        conn = db_pool.getconn()
        cur = conn.cursor()
        cur.execute("""
            SELECT email, profile_url
            FROM users_info
            WHERE id = %s
        """, (user_id,))
        user = cur.fetchone()  
        return jsonify({
            "user": {
                "email": user[0],
                "profile_url": user[1],
              
            }
        }), 200
    except Exception as e:
        print("❌ Error fetching user details:", e)
        return jsonify({"error": "Failed to fetch user details"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            db_pool.putconn(conn)