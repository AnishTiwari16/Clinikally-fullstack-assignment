from flask import jsonify, request
from google import genai
from helpers.index import add_message, get_or_create_session, get_internal_user_id

def query_llm():
    try:
        data = request.get_json()
        input_query = data.get("input_query")
        session_id = data.get("session_id")
        if not input_query:
             return jsonify({"error": "Input query is required"}), 500
        user_id = get_internal_user_id()
        session_id, is_first_chat = get_or_create_session(user_id, session_id)
        add_message(session_id, "user", input_query)
        client = genai.Client()
        response = client.models.generate_content(
            model="gemini-2.5-flash", contents=input_query
        )
        add_message(session_id, "assistant", response.text)
        response_payload = {
            'response' : response.text
        }
        if is_first_chat:
            response_payload["session_id"] = session_id
        return jsonify(response_payload), 200;
    
    except Exception as e:
        print("❌ Failed to query LLM:", e)
        return jsonify({"error": "Failed to query LLM"}), 500