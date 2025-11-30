import os
from typing import Dict, List
import json
from groq import Groq
import PyPDF2
import re
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from json.decoder import JSONDecodeError

load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 
app.config['UPLOAD_FOLDER'] = 'temp_uploads'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

class ATSScorer:
    def __init__(self):
        # Get API key from environment variable
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables. Please check your .env file.")
        self.client = Groq(api_key=api_key)
        
    def extract_text_from_pdf(self, pdf_file) -> str:
        """Extract text content from a PDF file."""
        try:
            reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            return self._clean_text(text)
        except Exception as e:
            raise Exception(f"Error reading PDF: {str(e)}")
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text content."""
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        return text

    def analyze_resume(self, resume_text: str, job_description: str) -> Dict:
            prompt = f"""
            You are a very strict ATS analyzer. Your task is to thoroughly critique the resume against the job description with these requirements:

            CRITICAL REQUIREMENTS:
            1. Scores must be between 1-80, and can be any integer values (e.g., 43, 56)
            2. Every section (header, education, experience, projects etc.) MUST have detailed issues and improvements
            3. Each section MUST include specific weak elements with current content, detailed explanation, and improved version
            4. Never return empty arrays for improvements, issues, or weak elements
            5. Be extremely critical - point out even minor flaws
            6. Check if sentences start with action verbs and contain numerical data. If not, deduct points and suggest improvements.
            7. Identify and reduce repetition of action verbs in the same resume.
            
            Resume:
            {resume_text}
            
            Job Description:
            {job_description}
            
            Provide analysis in this exact JSON format:
            {{
                "ats_score": <score_1_to_80>,
                "format_score": <score_1_to_80>,
                "keyword_score": <score_1_to_80>,
                "section_scores": {{
                    "header": <score_1_to_80>,
                    "profile": <score_1_to_80>,
                    "experience": <score_1_to_80>,
                    "skills": <score_1_to_80>,
                    "education": <score_1_to_80>,
                    "projects": <score_1_to_80>,
                    "achievements": <score_1_to_80>
                }},
                "keyword_matches": [<keywords>],
                "missing_keywords": [<keywords>],
                "section_analysis": {{
                    "header": {{
                        "issues": ["Must list at least 3 specific issues"],
                        "improvements": ["Must list at least 3 specific improvements"],
                        "weak_elements": [
                            {{
                                "current": "<exact current content>",
                                "why_weak": "<detailed explanation>",
                                "improved": "<specific improvement>"
                            }}
                        ]
                    }},
                    "profile": {{
                        "issues": ["Must list at least 3 specific issues"],
                        "improvements": ["Must list at least 3 specific improvements"],
                        "weak_elements": [Same structure as header]
                    }},
                    "experience": {{
                        "issues": ["Must list at least 3 specific issues"],
                        "improvements": ["Must list at least 3 specific improvements"],
                        "weak_bullets": [{{
                            "current": "<exact bullet point>",
                            "why_weak": "<detailed critique>",
                            "improved": "<enhanced version>"
                        }}]
                    }},
                    "skills": {{
                        "issues": ["Must list at least 3 specific issues"],
                        "improvements": ["Must list at least 3 specific improvements"],
                        "weak_elements": [Same structure as header]
                    }},
                    "education": {{
                        "issues": ["Must list at least 3 specific issues"],
                        "improvements": ["Must list at least 3 specific improvements"],
                        "weak_elements": [Same structure as header]
                    }},
                    "projects": {{
                        "issues": ["Must list at least 3 specific issues"],
                        "improvements": ["Must list at least 3 specific improvements"],
                        "weak_elements": [Same structure as header]
                    }},
                    "achievements": {{
                        "issues": ["Must list at least 3 specific issues"],
                        "improvements": ["Must list at least 3 specific improvements"],
                        "weak_elements": [Same structure as header]
                    }}
                }},
                "action_verbs_missing": [<verbs>],
                "formatting_issues": [<issues>],
                "overall_recommendations": [<recommendations>]
            }}

            REMEMBER:
            - No empty arrays allowed
            - Scores can be integer values (e.g., 57, 63)
            - Maximum score is 80
            - Be extremely critical in your analysis
            - Check for action verbs and numerical data in each sentence
            - Reduce repetition of action verbs
            """

            try:
                response = self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": "You are an ATS expert. Provide detailed, actionable resume analysis."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1,
                    max_tokens=8000
                )
                if not response.choices or not response.choices[0].message.content.strip():
                    raise Exception("Empty response from Groq API")
                
                content = response.choices[0].message.content
                
                # Try multiple approaches to extract JSON
                json_str = None
                
                # Approach 1: Extract JSON from Markdown code block (```json)
                json_match = re.search(r'```json\s*({.*?})\s*```', content, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                
                # Approach 2: Extract JSON directly if no Markdown block is found
                if not json_str:
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        json_str = json_match.group(0)
                
                # Approach 3: If no JSON is found, assume the entire content is JSON
                if not json_str:
                    json_str = content
                
                # Parse the JSON
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError as e:
                    raise Exception(f"Invalid JSON response from Groq API: {str(e)}")
            except Exception as e:
                raise Exception(f"Error in analysis: {str(e)}")
        
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'

@app.route('/ats-score', methods=['POST'])
def analyze_resume():
    try:
        # Check if resume file was uploaded
        if 'resume' not in request.files:
            return jsonify({'error': 'No resume file uploaded'}), 400
        
        file = request.files['resume']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Check if job description was provided
        job_description = request.form.get('job_description')
        if not job_description:
            return jsonify({'error': 'No job description provided'}), 400
        
        if file and allowed_file(file.filename):
            try:
                # Initialize scorer
                scorer = ATSScorer()
                
                # Extract text from PDF
                resume_text = scorer.extract_text_from_pdf(file)
                
                # Analyze resume
                analysis = scorer.analyze_resume(resume_text, job_description)
                
                return jsonify({
                    'status': 'success',
                    'analysis': analysis
                })
                
            except Exception as e:
                return jsonify({
                    'status': 'error',
                    'message': str(e)
                }), 500
        else:
            return jsonify({'error': 'Invalid file format. Only PDF files are allowed'}), 400
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# if __name__ == '__main__':
#     app.run(debug=True, port=5000)