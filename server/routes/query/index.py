from flask import jsonify, request
from google import genai
from helpers.index import (
    add_message, 
    get_or_create_session, 
    get_internal_user_id,
    has_previous_messages,
    extract_first_four_words,
    update_session_title_auto
)

def query_llm():
    try:
        data = request.get_json()
        input_query = data.get("input_query")
        session_id = data.get("session_id")
        if not input_query:
             return jsonify({"error": "Input query is required"}), 500
        user_id = get_internal_user_id()
        extracted_session_id = get_or_create_session(user_id, session_id)
        
        # Check if this is the first message in the session
        is_first_message = not has_previous_messages(extracted_session_id)
        
        add_message(extracted_session_id, "user", input_query)
        client = genai.Client()
        response = client.models.generate_content(
            model="gemini-2.5-flash", contents=input_query
        )
        add_message(extracted_session_id, "assistant", response.text)
        
        # If this is the first message, automatically set title to first 2 words of AI response
        if is_first_message:
            title = extract_first_four_words(response.text)
            if title:
                update_session_title_auto(extracted_session_id, title)
        
        response_payload = {
            'response' : response.text,
            'session_id' : extracted_session_id
        }
        return jsonify(response_payload), 200;
    
    except Exception as e:
        print("❌ Failed to query LLM:", e)
        return jsonify({"error": "Failed to query LLM"}), 500