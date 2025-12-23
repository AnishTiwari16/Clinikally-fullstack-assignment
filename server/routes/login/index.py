from flask import jsonify, make_response
from db.index import db_pool
from helpers.index import generate_session_token
def onboard_user(email, profile_url):
    conn = None
    cur = None
    try:
        if not email:
            return jsonify({"error" : "email is requred"}), 400
        conn = db_pool.getconn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO users_info (email, profile_url)
            VALUES (%s, %s)
            ON CONFLICT (email) DO NOTHING
        """, (email, profile_url)) 
        conn.commit()
        access_token, refresh_token = generate_session_token(email)
        response = make_response(jsonify({
            "message": "User logged in successfully",
            "access_token": access_token,
        }))
        response.set_cookie(
                "refresh_token",
                refresh_token,
                httponly=True,
                secure=True,     
                samesite="None", 
                max_age=60 * 60 * 24 * 7  # 7 days
            )
        return response, 200
    except Exception as e:
        if conn:
                conn.rollback()
        return jsonify({"error": "Something went wrong!"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            db_pool.putconn(conn)