# import re
# import json
# import time
# import requests
# from flask import Flask, request, jsonify

# app = Flask(__name__)
# OLLAMA_API_URL = "http://localhost:11434/api/generate"

# def clean_json_string(json_str):
#     json_str = json_str.replace('`', '"')
#     json_str = json_str.strip()
    
#     return json_str

# @app.route('/generate-quiz', methods=['POST'])
# def generate_quiz():
#     try:
#         # Validate input data
#         data = request.get_json()
#         if not data:
#             return jsonify({
#                 "error": "No input data provided"
#             }), 400

#         # Extract and validate parameters
#         model_name = data.get("model_name")
#         topic = data.get("topic")
#         num_questions = data.get("num_questions")
#         difficulty = data.get("difficulty")

#         # Perform input validation
#         if not all([model_name, topic, num_questions, difficulty]):
#             return jsonify({
#                 "error": "Missing required parameters",
#                 "required": ["model_name", "topic", "num_questions", "difficulty"]
#             }), 400

#         try:
#             num_questions = int(num_questions)
#         except ValueError:
#             return jsonify({
#                 "error": "Number of questions must be an integer"
#             }), 400

#         # Construct the prompt with explicit JSON formatting instructions
#         prompt = f"""
#         Generate {num_questions} {difficulty} multiple-choice questions about {topic}.
#         IMPORTANT: Ensure the response is a VALID JSON array. 
#         Strictly follow this JSON format:
#         [
#           {{
#             "question": "Detailed question text",
#             "options": {{
#               "A": "First option text without quotes or special characters",
#               "B": "Second option text without quotes or special characters", 
#               "C": "Third option text without quotes or special characters",
#               "D": "Fourth option text without quotes or special characters"
#             }},
#             "correct_answer": "A or B or C or D"
#           }}
#         ]

#         Rules:
#         - Generate exactly {num_questions} questions
#         - Make questions {difficulty} level appropriate
#         - Provide clear and distinct options
#         - Avoid using quotes or special characters in option texts
#         """

#         # Prepare payload for Ollama API
#         payload = {
#             "model": model_name,
#             "prompt": prompt,
#             "stream": True
#         }

#         # Measure processing time
#         start_time = time.time()

#         try:
#             # Send request to Ollama API
#             response = requests.post(OLLAMA_API_URL, json=payload, stream=True, timeout=30)
#             response.raise_for_status()
#         except requests.RequestException as req_err:
#             return jsonify({
#                 "error": "API Request Failed",
#                 "details": str(req_err)
#             }), 500

#         # Collect the full response
#         complete_response = ""
#         for line in response.iter_lines(decode_unicode=True):
#             if line and line.strip():
#                 try:
#                     json_line = json.loads(line)
#                     if "response" in json_line:
#                         complete_response += json_line["response"]
#                 except json.JSONDecodeError:
#                     continue

#         # Extract and clean JSON
#         try:
#             # Use regex to find the first JSON array in the response
#             json_match = re.search(r'\[.*\]', complete_response, re.DOTALL)
#             if not json_match:
#                 return jsonify({
#                     "error": "No valid JSON array found",
#                     "raw_response": complete_response
#                 }), 400

#             # Clean the JSON string
#             clean_json = clean_json_string(json_match.group(0))

#             # Parse the cleaned JSON
#             quiz_data = json.loads(clean_json)

#             # Validate the extracted quiz data
#             if not isinstance(quiz_data, list) or len(quiz_data) != num_questions:
#                 return jsonify({
#                     "error": f"Expected {num_questions} questions, but got different number",
#                     "raw_response": complete_response
#                 }), 400

#         except (json.JSONDecodeError, ValueError) as json_err:
#             return jsonify({
#                 "error": "Failed to parse quiz JSON",
#                 "details": str(json_err),
#                 "raw_response": complete_response
#             }), 400

#         # Calculate total processing time
#         end_time = time.time()
#         total_time = end_time - start_time

#         # Return successful response
#         return jsonify({
#             "quiz": quiz_data,
#             "total_time_seconds": total_time
#         })

#     except Exception as e:
#         # Catch any unexpected errors
#         return jsonify({
#             "error": "Unexpected error occurred",
#             "details": str(e)
#         }), 500

# if __name__ == '__main__':
#     app.run(debug=True, port=5000)

import re
import json
import time
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)
OLLAMA_API_URL = "http://localhost:11434/api/generate"

def extract_and_clean_json(text):
    # Remove any text before [ and after ]
    text = text.strip()
    start = text.find('[')
    end = text.rfind(']')
    
    if start == -1 or end == -1:
        return None
        
    json_str = text[start:end + 1]
    
    # Replace single quotes with double quotes
    json_str = json_str.replace("'", '"')
    
    # Remove any escaped characters
    json_str = json_str.encode().decode('unicode_escape')
    
    return json_str

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No input data provided"}), 400

        model_name = data.get("model_name")
        topic = data.get("topic")
        num_questions = int(data.get("num_questions", 0))
        difficulty = data.get("difficulty")

        if not all([model_name, topic, num_questions, difficulty]):
            return jsonify({
                "error": "Missing required parameters",
                "required": ["model_name", "topic", "num_questions", "difficulty"]
            }), 400

        prompt = f"""Generate {num_questions} {difficulty} multiple-choice questions about {topic}.
        Return ONLY a JSON array in this format:
        [
          {{
            "question": "Question text",
            "options": {{
              "A": "First option",
              "B": "Second option",
              "C": "Third option",
              "D": "Fourth option"
            }},
            "correct_answer": "A"
          }}
        ]"""

        start_time = time.time()
        
        response = requests.post(
            OLLAMA_API_URL, 
            json={"model": model_name, "prompt": prompt, "stream": True}, 
            stream=True, 
            timeout=30
        )
        
        complete_response = ""
        for line in response.iter_lines(decode_unicode=True):
            if line and line.strip():
                try:
                    json_line = json.loads(line)
                    if "response" in json_line:
                        complete_response += json_line["response"]
                except json.JSONDecodeError:
                    continue

        json_str = extract_and_clean_json(complete_response)
        if not json_str:
            return jsonify({
                "error": "Failed to extract JSON",
                "raw_response": complete_response
            }), 400

        try:
            quiz_data = json.loads(json_str)
            if len(quiz_data) != num_questions:
                return jsonify({
                    "error": f"Expected {num_questions} questions, got {len(quiz_data)}"
                }), 400

            return jsonify({
                "quiz": quiz_data,
                "total_time_seconds": time.time() - start_time
            })

        except json.JSONDecodeError as e:
            return jsonify({
                "error": "JSON parsing failed",
                "details": str(e),
                "extracted_json": json_str
            }), 400

    except Exception as e:
        return jsonify({
            "error": "Unexpected error",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)