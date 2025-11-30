from flask import Flask, request, jsonify
import os
import re
import json
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['GOOGLE_API_KEY'] = os.getenv('GOOGLE_API_KEY')
PORT = os.getenv('PORT')

print('===========================')
print(app.config['GOOGLE_API_KEY'])
print('===========================')

DOMAINS = {
    'Programming Languages': ['Python', 'Java', 'JavaScript', 'C++', 'Go', 'Rust', 'TypeScript', 'Ruby'],
    'Web Development': ['Frontend', 'Backend', 'Full Stack', 'DevOps', 'Web Security', 'API Development', 'Web Performance'],
    'Database': ['SQL', 'NoSQL', 'Database Design', 'Query Optimization', 'Data Warehousing', 'Database Administration', 'Data Engineering'],
    'Machine Learning': ['Deep Learning', 'NLP', 'Computer Vision', 'Data Science', 'Reinforcement Learning', 'ML Operations (MLOps)', 'Explainable AI', 'Federated Learning'],
    'System Design': ['Architecture', 'Scalability', 'Microservices', 'Cloud Computing', 'Distributed Systems', 'Load Balancing', 'High Availability', 'Networking'],
    'Data Engineering': ['ETL Processes', 'Data Pipelines', 'Big Data', 'Data Lakes', 'Stream Processing', 'Data Governance'],
    'Cybersecurity': ['Network Security', 'Application Security', 'Cryptography', 'Ethical Hacking', 'Threat Detection', 'Incident Response'],
    'Software Engineering': ['Agile Methodologies', 'Software Testing', 'Quality Assurance', 'Software Lifecycle', 'Version Control', 'Code Review'],
    'Cloud Computing': ['AWS', 'Azure', 'Google Cloud', 'Serverless Architecture', 'Cloud Security', 'Containerization (Docker, Kubernetes)'],
    'Blockchain': ['Smart Contracts', 'Cryptocurrencies', 'Decentralized Applications (DApps)', 'Consensus Algorithms', 'Ethereum'],
    'Embedded Systems': ['Microcontrollers', 'IoT', 'Firmware Development', 'Real-time Systems'],
    'Computer Graphics': ['Rendering', '3D Modeling', 'Virtual Reality (VR)', 'Augmented Reality (AR)', 'Game Development'],
    'Artificial Intelligence': ['General AI', 'Cognitive Computing', 'Expert Systems', 'AI Ethics'],
    'Networking': ['Network Protocols', 'IP Routing', 'Wireless Networks', 'Network Topologies', 'VPN', 'Firewalls'],
}

LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

def setup_gemini():
    genai.configure(api_key=app.config['GOOGLE_API_KEY'])
    
    # Configure generation parameters for more creative and diverse output
    generation_config = genai.types.GenerationConfig(
        temperature=0.9,        # High creativity (0.0-1.0)
        top_p=0.8,             # Nucleus sampling for diversity
        top_k=40,              # Consider top 40 tokens
        max_output_tokens=2048, # Sufficient length for detailed answers
        candidate_count=1
    )
    
    model = genai.GenerativeModel(
        'gemini-1.5-flash-002',
        generation_config=generation_config
    )
    return model

def format_gemini_response(text):
    questions = []
    question_blocks = re.split(r'\d+\.', text)

    for block in question_blocks:
        block = block.strip()
        if not block:
            continue

        parts = block.split('Answer:')
        if len(parts) == 2:
            question = parts[0].replace('Question:', '').strip()
            answer = parts[1].strip()

            if question and answer:
                questions.append({
                    'question': question,
                    'answer': answer
                })
    return questions or [{
        'question': 'Error generating questions',
        'answer': 'Please try again with different parameters.'
    }]


def generate_interview_questions(domain, codomain, level, count):
    try:
        model = setup_gemini()
        
        # Add randomization elements to make each generation unique
        import random
        current_time = datetime.now().strftime("%Y%m%d%H%M%S")
        random_aspects = [
            "problem-solving methodology", "real-world implementation", "best practices",
            "design patterns", "performance optimization", "troubleshooting approach",
            "architectural decisions", "team collaboration", "project experience",
            "technical challenges", "innovation approach", "scalability considerations"
        ]
        focus_aspect = random.choice(random_aspects)
        
        question_styles = [
            "scenario-based questions that test practical application",
            "experience-based questions about past projects",
            "hypothetical problem-solving questions",
            "design and architecture questions",
            "troubleshooting and debugging questions",
            "best practices and methodology questions"
        ]
        style = random.choice(question_styles)
        
        prompt = f'''Generate {count} UNIQUE and DIVERSE technical INTERVIEW questions for {domain}, specifically focusing on {codomain} at the {level} level. 
        
        Session ID: {current_time} - Generate completely fresh questions, avoid common patterns.
        Focus aspect: {focus_aspect}
        Question style: {style}
        
        CRITICAL: Make each question UNIQUE and CREATIVE. Avoid generic questions. Each question should:
        - Be distinctly different from typical interview questions
        - Focus on {focus_aspect} specifically
        - Use {style} approach
        - Test deep understanding, not memorization
        - Encourage detailed explanations of thought processes
        - Be conversation-oriented and open-ended
        - Avoid yes/no or single-answer questions
        
        Make questions that would reveal candidate's true expertise and problem-solving ability.
        Vary the complexity and approach for each question significantly.
        
        For each question, provide a comprehensive technical answer that explains the concept thoroughly.

        Format exactly as follows:

        1. Question: Write your unique question here
        Answer: Write your detailed answer here

        2. Question: Write your unique question here  
        Answer: Write your detailed answer here

        (continue this format for all {count} questions)'''

        response = model.generate_content(prompt)
        questions = format_gemini_response(response.text)
        print(questions)

        return questions[:10]

    except Exception as e:
        print(f"Error generating questions: {str(e)}")
        return [{
            'question': 'Error generating questions',
            'answer': 'Please try again.'
        }]

@app.route('/api/domains', methods=['GET'])
def get_domains():
    print('got the request for /domains')
    domains_with_codomains = {domain: codomains for domain, codomains in DOMAINS.items()}
    return jsonify({
        'domains': domains_with_codomains,
        'levels': LEVELS,
        'api': app.config['GOOGLE_API_KEY']
    })

@app.route('/api/codomains/<domain>', methods=['GET'])
def get_codomains(domain):
    return jsonify({
        'codomains': DOMAINS.get(domain, [])
    })

@app.route('/api/generate', methods=['POST'])
def generate():
    print('got the request')
    data = request.get_json()

    # Validate required fields
    required_fields = ['domain', 'codomain', 'level', 'count']
    if not all(field in data for field in required_fields):
        return jsonify({
            'error': 'Missing required fields. Please provide domain, codomain, level and count.'
        }), 400

    # Validate domain and level
    if data['domain'] not in DOMAINS:
        return jsonify({'error': 'Invalid domain'}), 400
    if data['level'] not in LEVELS:
        return jsonify({'error': 'Invalid level'}), 400
    if data['codomain'] not in DOMAINS[data['domain']]:
        return jsonify({'error': 'Invalid codomain for the selected domain'}), 400

    print('Generating question')

    questions = generate_interview_questions(
        data['domain'],
        data['codomain'],
        data['level'],
        data['count']
    )
    return jsonify(questions)
#
# if __name__ == '__main__':
#     app.run(debug=True, port=PORT)