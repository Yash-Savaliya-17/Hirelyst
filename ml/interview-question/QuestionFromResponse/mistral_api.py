# mistral_api.py
import requests
import json
import subprocess
from functools import lru_cache
import time
from tenacity import retry, stop_after_attempt, wait_exponential

# List of possible topics
TOPICS = ["mathematics", "physics", "computer science"]
@lru_cache(maxsize=None)
def get_ollama_models():
    try:
        result = subprocess.run(["ollama", "list"], capture_output=True, text=True)
        if result.returncode == 0:
            return [line.split()[0] for line in result.stdout.splitlines()[1:]]
        return []
    except FileNotFoundError:
        return []
def check_ollama_status():
    return bool(get_ollama_models())
def generate_prompt(domain, codomain, previous_qna, is_unsatisfactory_answer):
    prompt = f"You are conducting an adaptive interview in the domain '{domain}' and co-domain '{codomain}'.\n"
    if previous_qna:
        prompt += "Previous questions and answers:\n"
        for entry in previous_qna[-3:]:  
            prompt += f"Q: {entry['question']} A: {entry['user_answer']}\n"
    if is_unsatisfactory_answer:
        prompt += "The user doesn't know much about this topic. Switch to a different aspect or a related topic.\n"
    elif len(previous_qna) >= 2 and all(entry['user_answer'].lower() not in ["i don't know", "no idea"] for entry in previous_qna[-2:]):
        prompt += "The user seems knowledgeable. Ask a more challenging question on this topic.\n"
    
    prompt += "Generate a new question and its short-form answer. Format: Question: ... Answer: ..."
    return prompt

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def call_ollama_api(model, prompt):
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": model,
            "prompt": prompt,
            "stream": False
        },
        timeout=30  
    )
    
    if response.status_code != 200:
        raise Exception(f"Ollama API error: {response.status_code} - {response.text}")
    
    return response.json().get("response", "").strip()

def fetch_next_question(domain: str, codomain: str, previous_qna: list, is_unsatisfactory_answer: bool):
    if len(previous_qna) >= 10:
        return "This concludes the interview. Thank you!", "No correct answer needed.", True
    prompt = generate_prompt(domain, codomain, previous_qna, is_unsatisfactory_answer)
    try:
        if not check_ollama_status():
            raise Exception("Ollama is not running. Please start Ollama and try again.")
        models = get_ollama_models()
        if not models:
            raise Exception("No Ollama models found. Please pull a model (e.g., 'ollama pull mistral') and try again.")
        model = next((m for m in models if m.lower().startswith("mistral")), models[0])
        content = call_ollama_api(model, prompt)
        if "Question:" in content and "Answer:" in content:
            question = content.split("Question:")[1].split("Answer:")[0].strip()
            correct_answer = content.split("Answer:")[1].strip()
        else:
            raise Exception(f"Invalid response format from Ollama model: {content}")
        return question, correct_answer, False
    except requests.exceptions.RequestException as e:
        print(f"Network error in fetch_next_question: {e}")
        raise
    except json.JSONDecodeError as e:
        print(f"JSON decoding error in fetch_next_question: {e}")
        raise
    except Exception as e:
        print(f"Error in fetch_next_question: {e}")
        raise