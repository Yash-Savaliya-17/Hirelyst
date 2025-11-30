import os
import json
import random
from flask import Flask, request, jsonify
import groq
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = groq.Client(api_key=GROQ_API_KEY)

# Topics list for coding questions
CODING_TOPICS = [
    "Arrays", "Strings", "Linked Lists", "Stacks", "Queues", 
    "Trees", "Binary Search Trees", "Heaps", "Hash Tables", 
    "Graphs", "Dynamic Programming", "Greedy Algorithms", 
    "Sorting Algorithms", "Searching Algorithms", "Recursion",
    "Backtracking", "Bit Manipulation", "Math", "Binary Search",
    "Two Pointers", "Sliding Window", "Divide and Conquer"
]

def generate_coding_question(topic=None):
    """
    Generate a coding question using Groq API
    """
    if not topic:
        topic = random.choice(CODING_TOPICS)
    
    prompt = f"""
    Generate a challenging coding interview question on the topic of {topic}. 
    Return the response strictly in the following JSON format:
    {{
      "question_title": "Brief, catchy title",
      "difficulty": "Easy/Medium/Hard",
      "topic": "{topic}",
      "problem_statement": "Detailed problem description with examples",
      "constraints": ["List of constraints like input sizes, time/space complexity requirements"],
      "sample_test_cases": [
        {{"input": "Sample input 1", "output": "Expected output 1", "explanation": "Explanation of the test case"}},
        {{"input": "Sample input 2", "output": "Expected output 2", "explanation": "Explanation of the test case"}}
      ],
      "hidden_test_cases": [
        {{"input": "Hidden input 1", "output": "Expected output 1"}},
        ... (total of 10 hidden test cases)
      ],
      "hints": [
        "Hint 1 - A subtle hint that guides toward the solution",
        "Hint 2 - A more direct hint",
        "Hint 3 - Almost gives away the approach"
      ]
    }}
    
    Ensure that the question is original and challenging. The hidden test cases should cover edge cases and corner scenarios.
    """
    
    try:
        response = client.chat.completions.create(
            model="mistral-saba-24b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2048,
        )
        
        content = response.choices[0].message.content
        
        # Try to parse the JSON from the response
        try:
            # Find JSON in the response in case there's additional text
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            if start_idx >= 0 and end_idx > start_idx:
                json_content = content[start_idx:end_idx]
                question_data = json.loads(json_content)
                return question_data
            else:
                return {"error": "Could not extract valid JSON from model response"}
        except json.JSONDecodeError:
            return {"error": "Invalid JSON format in model response", "raw_content": content}
    
    except Exception as e:
        return {"error": str(e)}

@app.route('/generate-coding-questions', methods=['POST'])
def generate_questions():
    """
    API endpoint to generate coding questions
    """
    data = request.get_json()
    
    if not data or 'num_questions' not in data:
        return jsonify({'error': 'Missing num_questions parameter'}), 400
    
    num_questions = data['num_questions']
    
    try:
        num_questions = int(num_questions)
        if num_questions <= 0 or num_questions > 10:
            return jsonify({'error': 'num_questions must be between 1 and 10'}), 400
    except ValueError:
        return jsonify({'error': 'num_questions must be an integer'}), 400
    
    # Optional topic parameter
    topic = data.get('topic', None)
    
    questions = []
    for _ in range(num_questions):
        question = generate_coding_question(topic)
        questions.append(question)
    
    return jsonify({'questions': questions})

if __name__ == '__main__':    
    app.run(debug=True, host='0.0.0.0', port=5000)