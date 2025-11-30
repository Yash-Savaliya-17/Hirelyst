from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from mistral_api import fetch_next_question, TOPICS
import json
import random
import asyncio

app = FastAPI()
class QuestionRequest(BaseModel):
    domain: str
    codomain: str
    user_answer: str
    previous_qna: list
class QuestionResponse(BaseModel):
    question: str
    correct_answer: str
    is_last_question: bool

def save_interview_data(entry):
    try:
        with open("interview_data.json", "r+") as f:
            data = f.read()
            entries = json.loads(data) if data else []
            entries.append(entry)
            f.seek(0)
            json.dump(entries, f, indent=4)
            f.truncate()
    except Exception as e:
        print(f"Error saving interview data: {e}")

@app.post("/generate_question", response_model=QuestionResponse)
async def get_next_question(request: QuestionRequest):
    try:
        is_unsatisfactory_answer = any(keyword in request.user_answer.lower() for keyword in ["sorry", "don't know", "no idea", "not sure", "i don't know"])
        if is_unsatisfactory_answer:
            new_topic = random.choice([topic for topic in TOPICS if topic not in request.domain.lower()])
            request.domain = f"{request.domain}, {new_topic}"
        question, correct_answer, is_last_question = await asyncio.to_thread(
            fetch_next_question,
            request.domain, request.codomain, request.previous_qna, is_unsatisfactory_answer
        )
        entry = {
            "question": question,
            "correct_answer": correct_answer,
            "user_answer": request.user_answer
        }
        save_interview_data(entry)
        return {
            "question": question, 
            "correct_answer": correct_answer, 
            "is_last_question": is_last_question
        }
    except Exception as e:
        error_message = str(e)
        print(f"Error in get_next_question: {error_message}")
        if "Ollama is not running" in error_message:
            raise HTTPException(status_code=503, detail="Ollama service is not available. Please start Ollama and try again.")
        elif "No Ollama models found" in error_message:
            raise HTTPException(status_code=404, detail="No Ollama models found. Please pull a model (e.g., 'ollama pull mistral') and try again.")
        elif "model" in error_message and "not found" in error_message:
            raise HTTPException(status_code=404, detail=f"Ollama model not found. {error_message}")
        elif "Read timed out" in error_message:
            raise HTTPException(status_code=504, detail="Ollama service timed out. The model might be too slow or busy. Please try again or consider using a smaller model.")
        else:
            raise HTTPException(status_code=500, detail=error_message)
        
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)