from flask import Flask, g
from flask_cors import CORS
from flask_limiter import Limiter
from routes.login.index import onboard_user
from routes.query.index import query_llm
from routes.user_info.index import user_info
from routes.sessions.add_session.index import add_session
from routes.sessions.get_sessions.index import get_sessions
from routes.sessions.get_session_messages.index import get_session_messages
from routes.sessions.update_session_title.index import update_session_title
from middleware.index import require_google_auth, require_auth
from helpers.index import get_api_key_limiter

# Initialize Flask app
app = Flask(__name__)

CORS(app, supports_credentials=True, origins=["http://localhost:3000", 'https://clinikally-client.vercel.app'])

limiter = Limiter(
    key_func=get_api_key_limiter,
    app=app,
    default_limits=[] 
)
@app.route("/login", methods=["POST"])
@require_google_auth
def login_fn():
    return onboard_user(g.user["email"], g.user["picture"])

@app.route("/user-info", methods=["GET"])
@require_auth
def userInfoFn():
    return user_info()

@app.route("/query", methods=["POST"])
@limiter.limit("5 per minute")
@require_auth
def query_llm_fn():
    return query_llm()

@app.route("/add-session", methods=["POST"])
@require_auth
def add_session_fn():
    return add_session()

@app.route("/get-sessions", methods=["GET"])
@require_auth
def get_sessions_fn():
    return get_sessions()

@app.route("/sessions/<session_id>/messages", methods=["GET"])
@require_auth
def get_session_messages_fn(session_id):
    return get_session_messages(session_id)

@app.route("/sessions/<session_id>/title", methods=["PUT"])
@require_auth
def update_session_title_fn(session_id):
    return update_session_title(session_id)




if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)

