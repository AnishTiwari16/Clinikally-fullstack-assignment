from flask import Flask, g
from routes.login.index import onboard_user
from middleware.index import require_google_auth, require_auth
from routes.user_info.index import user_info
from flask_cors import CORS
# Initialize Flask app
app = Flask(__name__)

CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
@app.route("/login", methods=["POST"])
@require_google_auth
def login_fn():
    return onboard_user(g.user["email"], g.user["picture"])

@app.route("/user-info", methods=["GET"])
@require_auth
def userInfoFn():
    return user_info()
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)

