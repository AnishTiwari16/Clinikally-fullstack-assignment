from db.index import db_pool

def get_session_messages(session_id):
    conn = db_pool.getconn()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT role, content
            FROM chat_messages
            WHERE session_id = %s
            ORDER BY created_at ASC
            """,
            (session_id,)
        )
        rows = cur.fetchall()
        return [{"role": r[0], "content": r[1]} for r in rows]
    finally:
        cur.close()
        db_pool.putconn(conn)