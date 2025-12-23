from flask import jsonify, request
from anthropic import Anthropic
from google import genai


def query_llm():
    try:
        data = request.get_json()
        input_query = data.get("input_query")
        if not input_query:
             return jsonify({"error": "Input query is required"}), 500
        client = genai.Client()
        response = client.models.generate_content(
            model="gemini-2.5-flash", contents=input_query
        )
        return jsonify({
            "response" : response.text
        }), 200;
    
    except Exception as e:
        print("❌ Failed to query LLM:", e)
        return jsonify({"error": "Failed to query LLM"}), 500