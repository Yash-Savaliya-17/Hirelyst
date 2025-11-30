import json
import re
import os
from dotenv import load_dotenv
from collections import Counter
from transformers import pipeline
import google.generativeai as genai
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer, util

load_dotenv()

gemini_api_key = os.getenv('GEMINI_API_KEY')
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in the environment variables.")

genai.configure(api_key=gemini_api_key)
gemini_model = genai.GenerativeModel('gemini-2.5-flash')
app = Flask(__name__)

# Load models
sentiment_pipeline = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")
clarity_model = SentenceTransformer("sentence-transformers/all-distilroberta-v1")

# Configuration
FILLER_WORDS = {"um", "uh", "like", "you know", "basically"}
POOR_STARTERS = {"so", "and", "but", "well", "I mean"}
OPTIMAL_WORD_COUNT_RANGE = (50, 150)

def calculate_clarity_score(user_answer: str, correct_answer: str, question: str) -> float:
    user_embedding = clarity_model.encode(user_answer, convert_to_tensor=True)
    correct_embedding = clarity_model.encode(correct_answer, convert_to_tensor=True)

    similarity_score = util.pytorch_cos_sim(user_embedding, correct_embedding).item()

    question_keywords = set(re.findall(r'\b\w+\b', question.lower()))
    user_words = set(re.findall(r'\b\w+\b', user_answer.lower()))
    overlap_count = len(question_keywords.intersection(user_words))
    total_keywords = len(question_keywords) if question_keywords else 1

    overlap_penalty = 1 - (overlap_count / total_keywords)
    adjusted_score = similarity_score * overlap_penalty

    final_score = max(0, min(adjusted_score, 1))

    return round(final_score, 4)

def calculate_similarity(text1: str, text2: str, model: SentenceTransformer) -> float:
    embeddings1 = model.encode(text1, convert_to_tensor=True)
    embeddings2 = model.encode(text2, convert_to_tensor=True)
    return util.pytorch_cos_sim(embeddings1, embeddings2).item()

def filler_word_analysis(text: str) -> dict:
    words = re.findall(r'\b\w+\b', text.lower())
    filler_counts = Counter(word for word in words if word in FILLER_WORDS)
    return {word: count for word, count in filler_counts.items()}

def get_concise_suggestion(word_count: int, text: str) -> str:
    if word_count < OPTIMAL_WORD_COUNT_RANGE[0]:
        return f"Your answer is too brief ({word_count} words). Expand it to include more relevant details while maintaining clarity. Aim for {OPTIMAL_WORD_COUNT_RANGE[0]}-{OPTIMAL_WORD_COUNT_RANGE[1]} words."
    elif word_count > OPTIMAL_WORD_COUNT_RANGE[1]:
        return f"Your answer is too long ({word_count} words). Try to be more concise while keeping key points. Target {OPTIMAL_WORD_COUNT_RANGE[0]}-{OPTIMAL_WORD_COUNT_RANGE[1]} words."
    return "Your answer length is appropriate."

def poor_starter_analysis(text: str) -> list:
    sentences = re.split(r'[.!?]', text)
    starters = [s.strip().split()[0].lower() for s in sentences if s.strip()]
    return [starter for starter in starters if starter in POOR_STARTERS]

def repetition_analysis(text: str) -> dict:
    tokens = re.findall(r'\b\w+\b', text.lower())
    return {word: count for word, count in Counter(tokens).items() if count > 1}

def generate_suggested_answer(user_answer: str, answer: str, question: str) -> str:
    try:
        input_text = f"""
            Question: "{question}"
            Expected Answer: "{answer}"
            User's Answer: "{user_answer}"

            Improve this answer by:
            1. Removing filler words
            2. Addressing key points directly
            3. Using clear language
            4. Keeping it between {OPTIMAL_WORD_COUNT_RANGE[0]}-{OPTIMAL_WORD_COUNT_RANGE[1]} words

            Provide only the improved answer in a natural, conversational tone.
        """

        response = gemini_model.generate_content(input_text)
        return response.text.strip() if response and response.text else "Error: No content generated"

    except Exception as e:
        return f"Error generating suggested answer: {str(e)}"

def analyze_entry(question: str, answer: str, user_answer: str) -> dict:
    fillers = filler_word_analysis(user_answer)
    poor_starters = poor_starter_analysis(user_answer)
    repetition = repetition_analysis(user_answer)
    clarity_score = calculate_clarity_score(user_answer, answer, question)
    word_count = len(re.findall(r'\b\w+\b', user_answer))
    conciseness = OPTIMAL_WORD_COUNT_RANGE[0] <= word_count <= OPTIMAL_WORD_COUNT_RANGE[1]

    strengths = []
    weaknesses = []

    if clarity_score > 0.8:
        strengths.append("High clarity. Your response aligns well with the expected answer.")
    else:
        weaknesses.append("Clarity could be improved. Structure your response logically.")

    if fillers:
        weaknesses.append(f"Filler words detected: {', '.join(f'{word} ({count} times)' for word, count in fillers.items())}")
    else:
        strengths.append("No filler words. Excellent clarity.")

    if poor_starters:
        weaknesses.append(f"Weak sentence starters: {', '.join(poor_starters)}")

    conciseness_feedback = get_concise_suggestion(word_count, user_answer)

    suggested_answer = generate_suggested_answer(user_answer, answer, question)

    return {
        "filler_words": {word: count for word, count in fillers.items()},
        "poor_sentence_starters": poor_starters,
        "repetition_summary": "No significant repetition." if not repetition else f"Repetitive words: {', '.join([f'{word} ({count} times)' for word, count in repetition.items()])}",
        "clarity_score": clarity_score,
        "clarity_explanation": "Clarity measures how well your response matches the expected answer's key concepts and structure.",
        "word_count": word_count,
        "conciseness": conciseness,
        "conciseness_feedback": conciseness_feedback,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggested_answer": suggested_answer,
        "tone": sentiment_pipeline(user_answer)[0]["label"]
    }

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid input"}), 400

        question = data.get("question")
        answer = data.get("answer")
        user_answer = data.get("user_answer")

        if not all([question, answer, user_answer]):
            return jsonify({"error": "Missing required fields"}), 400

        analysis = analyze_entry(question, answer, user_answer)
        overall_score = (analysis["clarity_score"] + (1 if analysis["conciseness"] else 0)) / 2
        rating = "Excellent" if overall_score > 0.8 else "Good" if overall_score > 0.6 else "Needs Improvement"

        return jsonify({
            "analysis": analysis,
            "summary": {
                "overall_score": overall_score,
                "rating": rating
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)