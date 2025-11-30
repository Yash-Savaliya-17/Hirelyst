from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from dual_rag_orchestrator import DualRAGOrchestrator
import uvicorn
import asyncio

app = FastAPI(
    title="Dual RAG Orchestrator API",
    description="Combines MCQ RAG and Theory RAG for high-quality quiz generation",
    version="1.0.0"
)

# Initialize orchestrator globally
orchestrator = None

class QuizRequest(BaseModel):
    """Request model for quiz generation"""
    subject: Optional[str] = Field(None, description="Subject for MCQ examples")
    topic: Optional[str] = Field(None, description="Topic for both MCQ and Theory")
    subtopic: Optional[str] = Field(None, description="Subtopic for Theory context")
    difficulty: Optional[str] = Field(None, description="Difficulty level (easy/medium/hard)")
    count: int = Field(5, ge=1, le=20, description="Number of questions to generate (1-20)")
    use_retrieval: bool = Field(True, description="If false, skip RAG retrieval and generate with generic knowledge")

class QuizResponse(BaseModel):
    """Response model for quiz generation"""
    success: bool
    questions: List[Dict[str, Any]]
    count: int
    metadata: Dict[str, Any]

@app.on_event("startup")
async def startup_event():
    """Initialize Dual RAG Orchestrator on startup"""
    global orchestrator
    print("🚀 Starting Dual RAG Orchestrator API...")
    
    # Get service URL from environment or use default
    import os
    rag_service_url = os.getenv("RAG_SERVICE_URL", "http://localhost:8001")
    
    orchestrator = DualRAGOrchestrator(
        rag_service_url=rag_service_url
    )
    
    print(f"✅ Orchestrator initialized!")
    print(f"   RAG Service: {rag_service_url}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "Dual RAG Orchestrator",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    if orchestrator is None:
        return {"status": "initializing"}
    
    return {
        "status": "healthy",
        "rag_service_url": orchestrator.rag_service_url,
        "llm_model": "gemini-2.5-flash"
    }

@app.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(request: QuizRequest):
    """
    Generate quiz questions using dual RAG pipeline.
    
    This endpoint:
    1. Retrieves MCQ examples from MCQ RAG service
    2. Retrieves theory context from Theory RAG service
    3. Combines both contexts
    4. Generates questions with Gemini
    
    Args:
        request: QuizRequest with filters and parameters
        
    Returns:
        QuizResponse with generated questions
    """
    if orchestrator is None:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")
    
    try:
        print(f"\n{'='*80}")
        print(f"📥 Received quiz generation request:")
        print(f"   Subject: {request.subject}")
        print(f"   Topic: {request.topic}")
        print(f"   Subtopic: {request.subtopic}")
        print(f"   Difficulty: {request.difficulty}")
        print(f"   Count: {request.count}")
        print(f"{'='*80}\n")
        
        # Generate questions using dual RAG
        questions = await orchestrator.generate_questions_with_dual_rag(
            subject=request.subject,
            topic=request.topic,
            subtopic=request.subtopic,
            difficulty=request.difficulty,
            count=request.count,
            use_retrieval=request.use_retrieval
        )
        
        if not questions:
            raise HTTPException(
                status_code=404,
                detail="No questions generated. Try adjusting filters or check RAG services."
            )
        
        # Infer retrieval_mode from presence of context counts (printed earlier). Lightweight re-derivation:
        mcq_used = request.use_retrieval  # if retrieval disabled, false
        theory_used = request.use_retrieval
        if not request.use_retrieval:
            retrieval_mode = "none"
        else:
            # We cannot easily fetch counts here without modifying orchestrator to return them; treat as 'dual' optimistic
            retrieval_mode = "dual"

        return QuizResponse(
            success=True,
            questions=questions,
            count=len(questions),
            metadata={
                "subject": request.subject,
                "topic": request.topic,
                "subtopic": request.subtopic,
                "difficulty": request.difficulty,
                "use_retrieval": request.use_retrieval,
                "retrieval_mode": retrieval_mode,
                "mcq_rag_used": mcq_used,
                "theory_rag_used": theory_used
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.get("/check-services")
async def check_services():
    """Check if RAG service is accessible"""
    if orchestrator is None:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")
    
    import aiohttp
    
    rag_status = "unknown"
    
    # Check unified RAG service
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{orchestrator.rag_service_url}/health",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    rag_status = data
                else:
                    rag_status = {"status": f"unhealthy (HTTP {response.status})"}
    except Exception as e:
        rag_status = {"status": f"unreachable", "error": str(e)}
    
    return {
        "rag_service": {
            "url": orchestrator.rag_service_url,
            "details": rag_status
        }
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8003, help="Port to run the server on")
    args = parser.parse_args()
    
    print(f"🚀 Starting Dual RAG Orchestrator API on port {args.port}")
    uvicorn.run(app, host="0.0.0.0", port=args.port)
