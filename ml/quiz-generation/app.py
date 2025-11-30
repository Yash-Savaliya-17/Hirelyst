import google.generativeai as genai
import json
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

load_dotenv()


class QuizAPIService:
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        
        # Configure generation parameters for reliability and consistency
        generation_config = genai.types.GenerationConfig(
            temperature=0.7,        # Balanced between creativity and consistency
            top_p=0.8,             # More focused token sampling
            top_k=20,              # More focused token selection
            max_output_tokens=2048, # Increased token limit for better completion
            candidate_count=1,      # Single response for consistency
            stop_sequences=[],      # No custom stop sequences
        )
        
        safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_NONE",
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_NONE",
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_NONE",
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_NONE",
            },
        ]
        
        self.model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        # Track previous questions to avoid duplicates
        self.question_history = []

    def get_domains(self):
        return {
            "Programming Languages": ["Python", "Java", "JavaScript", "C++", "Ruby", "Rust", "Go", "Swift"],
            "Web Technologies": ["HTML", "CSS", "React", "Angular", "Vue.js", "Node.js", "Django", "Flask"],
            "Database": ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite"],
            "Aptitude": ["Logical Reasoning", "Quantitative Aptitude", "Verbal Reasoning", "Data Interpretation",
                         "Problem Solving"],
            "DevOps": ["Docker", "Kubernetes", "Jenkins", "AWS", "Azure", "CI/CD"]
        }

    def regenerate_question(self, domain, subdomain, difficulty):
        # Add extensive randomization to ensure completely different questions
        import random
        from datetime import datetime
        import hashlib
        
        current_time = datetime.now().strftime("%Y%m%d%H%M%S%f")  # Include microseconds
        random_seed = random.randint(10000, 99999)
        unique_id = hashlib.md5(f"{current_time}{random_seed}".encode()).hexdigest()[:8]
        
        # Multiple layers of randomization
        question_types = [
            "edge case scenarios", "real-world applications", "performance implications",
            "security considerations", "debugging challenges", "optimization techniques",
            "integration scenarios", "configuration details", "advanced features",
            "comparison questions", "troubleshooting situations", "best practice violations"
        ]
        
        focus_areas = [
            "syntax nuances", "error handling", "memory management", "concurrent programming",
            "design patterns", "architectural decisions", "testing strategies", "deployment issues",
            "version differences", "compatibility concerns", "performance bottlenecks"
        ]
        
        complexity_angles = [
            "with multiple constraints", "in distributed systems", "under high load",
            "with limited resources", "in legacy codebases", "with strict requirements",
            "in microservices architecture", "with third-party integrations"
        ]
        
        question_type = random.choice(question_types)
        focus_area = random.choice(focus_areas)
        complexity = random.choice(complexity_angles)
        
        # Add creative instruction variations
        creative_instructions = [
            "Think outside the box and create an unconventional question",
            "Focus on lesser-known aspects that experienced developers encounter",
            "Create a scenario-based question with practical implications", 
            "Design a question that reveals deep understanding rather than memorization",
            "Generate a question about common mistakes or misconceptions"
        ]
        instruction = random.choice(creative_instructions)
        
        prompt = f"""
        {instruction}
        
        Generate 1 COMPLETELY UNIQUE {difficulty} multiple-choice question about {subdomain} in {domain}.
        
        REGENERATION CONTEXT:
        - Unique ID: {unique_id}
        - Question Type: {question_type}
        - Focus Area: {focus_area} 
        - Complexity Angle: {complexity}
        - Timestamp: {current_time}
        
        CRITICAL REQUIREMENTS:
        - This must be RADICALLY DIFFERENT from typical {subdomain} questions
        - Focus on {question_type} related to {focus_area}
        - Apply the scenario {complexity}
        - Avoid common patterns like "What is...", "Which of the following..."
        - Create unique, thought-provoking scenarios
        - Test practical understanding, not just definitions
        
        ADVANCED GUIDELINES:
        - Use specific technical details and real-world contexts
        - Include code snippets, configurations, or practical scenarios if relevant
        - Make options that require careful analysis to distinguish
        - Focus on {focus_area} within {subdomain}
        
        Provide the response in a valid JSON array format with the following structure:
        [
          {{
            "question": "Your completely unique detailed question text",
            "options": {{
              "A": "First option text",
              "B": "Second option text", 
              "C": "Third option text",
              "D": "Fourth option text"
            }},
            "correct_answer": "A or B or C or D"
          }}
        ]
        
        Important: Return ONLY the JSON array with no additional notes, comments, or explanations.
        """
        try:
            # Generate content with safety checks
            response = self.model.generate_content(prompt)
            
            # Check if response is valid
            if not response or not hasattr(response, 'text'):
                return {"error": "Invalid response from Gemini API"}
                
            response_text = response.text.strip() if response.text else ""
            
            # Check if response text is empty
            if not response_text:
                return {"error": "Empty response from Gemini API"}

            # Find the first '[' and last ']' to extract just the JSON array
            start_idx = response_text.find('[')
            end_idx = response_text.rfind(']') + 1

            if start_idx == -1 or end_idx == 0:
                # Try to fix common JSON formatting issues
                cleaned_text = response_text.replace('```json', '').replace('```', '').strip()
                start_idx = cleaned_text.find('[')
                end_idx = cleaned_text.rfind(']') + 1
                
                if start_idx == -1 or end_idx == 0:
                    return {"error": "Could not find valid JSON array in response"}
                    
                json_str = cleaned_text[start_idx:end_idx]
            else:
                json_str = response_text[start_idx:end_idx]

            # Parse the JSON and validate
            try:
                quiz_data = json.loads(json_str)
            except json.JSONDecodeError as e:
                # Try to clean up the JSON string
                json_str = json_str.replace('\n', ' ').replace('\r', '')
                try:
                    quiz_data = json.loads(json_str)
                except json.JSONDecodeError:
                    return {"error": f"Failed to parse JSON response: {str(e)}"}

            if not isinstance(quiz_data, list) or len(quiz_data) == 0:
                return {"error": "No valid question was generated"}

            question = quiz_data[0]
            
            if not isinstance(question, dict):
                return {"error": "Generated question is not a valid object"}

            # Validate structure using the same logic as generate_quiz
            required_keys = {"question", "options", "correct_answer"}
            required_options = {"A", "B", "C", "D"}

            if not all(key in question for key in required_keys):
                missing_keys = required_keys - set(question.keys())
                return {"error": f"Question is missing required keys: {', '.join(missing_keys)}"}
                
            if not isinstance(question["options"], dict):
                return {"error": "Question options is not a valid object"}
                
            if not all(opt in question["options"] for opt in required_options):
                missing_opts = required_options - set(question["options"].keys())
                return {"error": f"Question is missing required options: {', '.join(missing_opts)}"}
                
            if question["correct_answer"] not in required_options:
                return {"error": f"Question has invalid correct_answer: {question['correct_answer']}"}

            return question

        except Exception as e:
            print(f"Question generation error: {str(e)}")
            return {"error": f"Question generation failed: {str(e)}"}

    def generate_quiz(self, domain, subdomain, num_questions, difficulty):
        # Add EXTREME randomization to force unique questions
        import random
        import hashlib
        from datetime import datetime
        
        # Create unique session identifier with multiple random elements
        current_time = datetime.now().strftime("%Y%m%d%H%M%S%f")  # Include microseconds
        random_seed = random.randint(100000, 999999)
        unique_session = hashlib.sha256(f"{current_time}{random_seed}{domain}{subdomain}".encode()).hexdigest()[:16]
        
        # Multiple randomization layers
        question_styles = [
            "code-based practical questions", "scenario-based problem solving", 
            "comparison and contrast questions", "debugging and troubleshooting",
            "optimization and performance questions", "security-focused questions",
            "integration and compatibility questions", "real-world application questions",
            "best practices and conventions", "version-specific feature questions",
            "error handling and edge cases", "architectural design questions"
        ]
        
        question_formats = [
            "multiple choice with code snippets", "scenario-based multiple choice",
            "technical definition questions", "practical application questions",
            "comparative analysis questions", "troubleshooting questions",
            "configuration-based questions", "feature identification questions"
        ]
        
        complexity_modifiers = [
            "with advanced concepts", "focusing on practical implementation",
            "emphasizing real-world usage", "testing deep understanding",
            "covering recent developments", "including industry standards",
            "with performance considerations", "including security aspects"
        ]
        
        # Pick random combinations
        style = random.choice(question_styles)
        format_type = random.choice(question_formats)
        complexity = random.choice(complexity_modifiers)
        
        prompt = f"""
        Generate {num_questions} {difficulty} multiple-choice questions about {subdomain} in {domain}.
        
        IMPORTANT: Focus specifically on {subdomain} concepts within {domain}
        
        For "Aptitude" -> "Logical Reasoning":
        - Create syllogism questions, pattern recognition, analogies, coding-decoding, logical sequences
        
        For "Programming Languages":
        - Create questions about syntax, features, and concepts of the specific language
        
        For other domains:
        - Create questions specific to the subdomain within that domain
        
        Return ONLY a JSON array (no extra text):
        [{{
            "question": "Question about {subdomain}",
            "options": {{
                "A": "Option A",
                "B": "Option B", 
                "C": "Option C",
                "D": "Option D"
            }},
            "correct_answer": "A"
        }}]
        """

        try:
            # Generate content with safety checks
            response = self.model.generate_content(prompt)
            
            # Check if response is valid
            if not response or not hasattr(response, 'text'):
                return {"error": "Invalid response from Gemini API"}
                
            response_text = response.text.strip() if response.text else ""
            
            # Check if response text is empty
            if not response_text:
                return {"error": "Empty response from Gemini API"}

            # Find the first '[' and last ']' to extract just the JSON array
            start_idx = response_text.find('[')
            end_idx = response_text.rfind(']') + 1

            if start_idx == -1 or end_idx == 0:
                # Try to fix common JSON formatting issues
                cleaned_text = response_text.replace('```json', '').replace('```', '').strip()
                start_idx = cleaned_text.find('[')
                end_idx = cleaned_text.rfind(']') + 1
                
                if start_idx == -1 or end_idx == 0:
                    return {"error": "Could not find valid JSON array in response"}
                    
                json_str = cleaned_text[start_idx:end_idx]
            else:
                json_str = response_text[start_idx:end_idx]

            # Parse the JSON and validate
            try:
                quiz_data = json.loads(json_str)
            except json.JSONDecodeError as e:
                # Try to clean up the JSON string
                json_str = json_str.replace('\n', ' ').replace('\r', '')
                try:
                    quiz_data = json.loads(json_str)
                except json.JSONDecodeError:
                    return {"error": f"Failed to parse JSON response: {str(e)}"}

            if not isinstance(quiz_data, list):
                return {"error": "Response is not a valid array of questions"}
                
            if len(quiz_data) == 0:
                return {"error": "No questions were generated"}
                
            if len(quiz_data) != num_questions:
                return {"error": f"Expected {num_questions} questions, got {len(quiz_data)}"}

            # Validate structure of each question
            required_keys = {"question", "options", "correct_answer"}
            required_options = {"A", "B", "C", "D"}

            for i, q in enumerate(quiz_data):
                if not isinstance(q, dict):
                    return {"error": f"Question {i+1} is not a valid object"}
                    
                if not all(key in q for key in required_keys):
                    missing_keys = required_keys - set(q.keys())
                    return {"error": f"Question {i+1} is missing required keys: {', '.join(missing_keys)}"}
                    
                if not isinstance(q["options"], dict):
                    return {"error": f"Question {i+1} options is not a valid object"}
                    
                if not all(opt in q["options"] for opt in required_options):
                    missing_opts = required_options - set(q["options"].keys())
                    return {"error": f"Question {i+1} is missing required options: {', '.join(missing_opts)}"}
                    
                if q["correct_answer"] not in required_options:
                    return {"error": f"Question {i+1} has invalid correct_answer: {q['correct_answer']}"}

            return quiz_data

        except Exception as e:
            print(f"Quiz generation error: {str(e)}")
            return {"error": f"Quiz generation failed: {str(e)}"}

# Initialize the Flask app
app = Flask(__name__)
CORS(app)

# Initialize the quiz service
gemini_api_key = os.getenv('GEMINI_API_KEY')
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

quiz_service = QuizAPIService(gemini_api_key)


@app.route('/api/domains', methods=['GET'])
def get_domains():
    try:
        domains = quiz_service.get_domains()
        return jsonify({
            "status": "success",
            "domains": domains
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/api/generate-quiz', methods=['POST'])
def generate_quiz_endpoint():
    try:
        data = request.get_json()
        print(f"Received request data: {data}")  # Debug log
        
        # Extract and validate required fields
        domain = data.get('domain')
        subdomain = data.get('subdomain')
        num_questions = data.get('num_questions', 5)
        difficulty = data.get('difficulty', 'Easy')
        
        if not all([domain, subdomain]):
            return jsonify({
                "status": "error",
                "message": "Missing required fields: domain and subdomain",
                "quiz": None
            }), 400
            
        # Generate quiz questions
        quiz_data = quiz_service.generate_quiz(domain, subdomain, num_questions, difficulty)
        print(f"Generated quiz data: {quiz_data}")  # Debug log
        
        # Check if quiz_data contains an error
        if isinstance(quiz_data, dict) and "error" in quiz_data:
            return jsonify({
                "status": "error",
                "message": quiz_data["error"],
                "quiz": None
            }), 200
            
        # Validate quiz_data is a non-empty list
        if not isinstance(quiz_data, list) or len(quiz_data) == 0:
            return jsonify({
                "status": "error",
                "message": "No questions were generated",
                "quiz": None
            }), 200
            
        # Return successful response with quiz data
        return jsonify({
            "status": "success",
            "message": f"Successfully generated {len(quiz_data)} questions",
            "quiz": quiz_data
        }), 200
        
    except Exception as e:
        print(f"Error in generate_quiz_endpoint: {str(e)}")  # Debug log
        return jsonify({
            "status": "error",
            "message": f"Quiz generation failed: {str(e)}",
            "quiz": None
        }), 200

@app.route('/api/regenerate-question', methods=['POST'])
def regenerate_question_endpoint():
    try:
        data = request.get_json()
        print(f"Received regenerate request data: {data}")  # Debug log
        
        # Extract and validate required fields
        domain = data.get('domain')
        subdomain = data.get('subdomain')
        difficulty = data.get('difficulty', 'Easy')
        
        if not all([domain, subdomain]):
            return jsonify({
                "status": "error",
                "message": "Missing required fields: domain and subdomain",
                "question": None
            }), 400
            
        # Generate a single question
        question_data = quiz_service.regenerate_question(domain, subdomain, difficulty)
        print(f"Generated question data: {question_data}")  # Debug log
        
        # Check if question_data contains an error
        if isinstance(question_data, dict) and "error" in question_data:
            return jsonify({
                "status": "error",
                "message": question_data["error"],
                "question": None
            }), 200
            
        # Return successful response with question data
        return jsonify({
            "status": "success",
            "message": "Successfully generated question",
            "question": question_data
        }), 200
        
    except Exception as e:
        print(f"Error in regenerate_question_endpoint: {str(e)}")  # Debug log
        return jsonify({
            "status": "error",
            "message": f"Question regeneration failed: {str(e)}",
            "question": None
        }), 200

@app.route('/api/get-domains', methods=['GET'])
def get_domains_endpoint():
    try:
        domains = quiz_service.get_domains()
        return jsonify({
            "status": "success",
            "domains": domains,
            "service": "Quiz Generation API"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Quiz Generation API"
    }), 200
