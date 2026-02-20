from flask import Flask, request, jsonify
import os
import re
import json
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['NEBIUS_API_KEY'] = os.getenv('NEBIUS_API_KEY')
PORT = os.getenv('PORT')

print('===========================')
print(app.config['NEBIUS_API_KEY'])
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

def setup_nebius_client():
    client = OpenAI(
        base_url="https://api.tokenfactory.nebius.com/v1/",
        api_key=app.config['NEBIUS_API_KEY']
    )
    return client

def format_gemini_response(text):
    print(f'🔍 Parsing response text (length: {len(text)})...')
    print(f'Full response: {text}')
    print('='*80)
    questions = []
    
    # Remove all markdown asterisks first to simplify parsing
    clean_text = text.replace('**', '')
    print(f'After removing **: {clean_text[:400]}')
    
    # Find all question-answer pairs using regex
    # Pattern: Look for "Question:" followed by content, then "Answer:" followed by content
    # Stop at the next "Question:" or end of string
    pattern = r'Question:?\s*(.+?)\s*Answer:?\s*(.+?)(?=Question:|$)'
    matches = re.findall(pattern, clean_text, re.DOTALL | re.IGNORECASE)
    
    print(f'Regex found {len(matches)} matches')
    
    for i, (question, answer) in enumerate(matches, 1):
        question = question.strip()
        answer = answer.strip()
        
        print(f'Match {i} - Q length: {len(question)}, A length: {len(answer)}')
        
        # Clean up markdown code blocks and extra numbering
        question = re.sub(r'```[\w]*\n?', '', question).strip()
        answer = re.sub(r'```[\w]*\n?', '', answer).strip()
        # Remove leading numbers like "1.", "2." from the question text
        question = re.sub(r'^\d+\.\s*', '', question).strip()
        answer = re.sub(r'^\d+\.\s*', '', answer).strip()
        
        if question and answer:
            questions.append({
                'question': question,
                'answer': answer
            })
            print(f'  ✓ Parsed question {i}: {question[:60]}...')
        else:
            print(f'  ✗ Question or answer is empty after cleaning')
    
    print(f'🔍 Total questions parsed: {len(questions)}')
    
    if not questions:
        print('⚠️ No questions parsed, returning error')
        return [{
            'question': 'Error generating questions',
            'answer': 'Please try again with different parameters.'
        }]
    
    return questions


def generate_interview_questions(domain, codomain, level, count):
    try:
        client = setup_nebius_client()
        
        # Build numbered question template showing exact format expected
        question_template = "\n\n".join([f"{i+1}. Question: [Write question {i+1} here]\nAnswer: [Write answer {i+1} here]" for i in range(count)])
        
        system_prompt = '''You are an expert technical interviewer. Your task is to generate interview questions in a specific format.'''
        
        user_message = f'''Generate EXACTLY {count} DISTINCT interview questions.

DOMAIN: {domain}
SUBDOMAIN: {codomain}
LEVEL: {level}
NUMBER OF QUESTIONS REQUIRED: {count}

⚠️ CRITICAL REQUIREMENTS ⚠️
1. Generate EXACTLY {count} separate questions (NOT 1, NOT {count-1}, EXACTLY {count})
2. Each question MUST be completely different from the others
3. Each question MUST have its own separate answer
4. Do NOT combine multiple questions into one
5. Do NOT generate extra questions beyond {count}

📋 MANDATORY FORMAT (copy this structure exactly):

{question_template}

✅ FORMAT RULES:
- Start each question with a number (1., 2., 3., etc.)
- Write "Question:" followed by the actual question text
- Write "Answer:" followed by the complete answer
- Keep each answer concise (2-4 paragraphs maximum)
- Separate each question-answer pair with a blank line
- Do NOT use markdown formatting like **, ##, or ```
- Do NOT add extra explanations or commentary

🎯 CONTENT REQUIREMENTS:
- Make questions scenario-based and practical
- Focus on {codomain} specifically
- Match the {level} difficulty level
- Test real-world understanding, not just theory

NOW GENERATE ALL {count} QUESTIONS FOLLOWING THE EXACT FORMAT ABOVE:'''

        print(f'📤 Sending prompt to Nebius API (requesting {count} questions)...')
        response = client.chat.completions.create(
            model="meta-llama/Llama-3.3-70B-Instruct",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            temperature=0.9,
            max_tokens=2048
        )
        response_text = response.choices[0].message.content
        print(f'📥 Received response from Nebius API (length: {len(response_text)} chars)')
        
        questions = format_gemini_response(response_text)
        print(f'📊 Parsed {len(questions)} questions from response')
        
        # Return exactly the requested count, or all if fewer were generated
        result = questions[:count] if len(questions) >= count else questions
        print(f'📦 Returning {len(result)} questions (requested: {count})')
        
        return result

    except Exception as e:
        print(f"❌ Error generating questions: {str(e)}")
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
        'api': app.config['NEBIUS_API_KEY']
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

    print(f'🎯 Generating {data["count"]} questions for {data["domain"]} - {data["codomain"]} ({data["level"]})')

    questions = generate_interview_questions(
        data['domain'],
        data['codomain'],
        data['level'],
        data['count']
    )
    
    print(f'✅ Generated {len(questions)} questions (requested: {data["count"]})')
    return jsonify(questions)
#
# if __name__ == '__main__':
#     app.run(debug=True, port=PORT)