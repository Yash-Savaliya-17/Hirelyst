import re
import json
import time
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForCausalLM

app = Flask(__name__)

tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.3-70B-Instruct")
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.3-70B-Instruct")

def clean_json_string(json_str):
    json_str = json_str.replace('`', '"')
    json_str = json_str.strip()
    return json_str

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No input data provided"}), 400
        topic = data.get("topic")
        num_questions = data.get("num_questions")
        difficulty = data.get("difficulty")

        if not all([topic, num_questions, difficulty]):
            return jsonify({
                "error": "Missing required parameters",
                "required": ["topic", "num_questions", "difficulty"]
            }), 400

        try:
            num_questions = int(num_questions)
        except ValueError:
            return jsonify({"error": "Number of questions must be an integer"}), 400

        # Construct the prompt
        prompt = f"""
        Generate {num_questions} {difficulty} multiple-choice questions about {topic}.
        IMPORTANT: Ensure the response is a VALID JSON array. 
        Strictly follow this JSON format:
        [
          {{
            "question": "Detailed question text",
            "options": {{
              "A": "First option text without quotes or special characters",
              "B": "Second option text without quotes or special characters", 
              "C": "Third option text without quotes or special characters",
              "D": "Fourth option text without quotes or special characters"
            }},
            "correct_answer": "A or B or C or D"
          }}
        ]
        """

        inputs = tokenizer(prompt, return_tensors="pt").to(device)
        outputs = model.generate(
            inputs["input_ids"],
            max_length=1024,
            num_return_sequences=1,
            temperature=0.7,
            top_p=0.9,
            do_sample=True
        )

        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

        try:
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if not json_match:
                return jsonify({
                    "error": "No valid JSON array found",
                    "raw_response": response_text
                }), 400

            clean_json = clean_json_string(json_match.group(0))
            quiz_data = json.loads(clean_json)

            # Validate the extracted quiz data
            if not isinstance(quiz_data, list) or len(quiz_data) != num_questions:
                return jsonify({
                    "error": f"Expected {num_questions} questions, but got different number",
                    "raw_response": response_text
                }), 400

        except (json.JSONDecodeError, ValueError) as json_err:
            return jsonify({
                "error": "Failed to parse quiz JSON",
                "details": str(json_err),
                "raw_response": response_text
            }), 400

        return jsonify({"quiz": quiz_data})

    except Exception as e:
        return jsonify({"error": "Unexpected error occurred", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
