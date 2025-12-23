from flask import Flask, g
from flask_cors import CORS
from flask_limiter import Limiter
from routes.login.index import onboard_user
from routes.query.index import query_llm
from routes.user_info.index import user_info
from middleware.index import require_google_auth, require_auth
from helpers.index import get_api_key_limiter

# Initialize Flask app
app = Flask(__name__)

CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

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
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)

