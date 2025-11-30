from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from rag_quiz_generator import RAGQuizGenerator
import uvicorn

app = FastAPI(
    title="RAG Quiz Generator API",
    description="High-quality quiz generation using RAG with Google Gemini",
    version="1.0.0"
)

# Initialize generator globally
generator = None

class QuizRequest(BaseModel):
    """Request model for quiz generation"""
    subject: Optional[str] = Field(None, description="Filter by subject")
    topic: Optional[str] = Field(None, description="Filter by topic")
    difficulty: Optional[str] = Field(None, description="Difficulty level (easy/medium/hard)")
    count: int = Field(5, ge=1, le=20, description="Number of questions to generate (1-20)")
    use_compression: bool = Field(False, description="Use contextual compression for retrieval")

class QuizResponse(BaseModel):
    """Response model for quiz generation"""
    success: bool
    questions: List[Dict[str, Any]]
    count: int
    metadata: Dict[str, Any]

@app.on_event("startup")
async def startup_event():
    """Initialize RAG generator on startup"""
    global generator
    print("🚀 Starting RAG Quiz Generator API...")
    generator = RAGQuizGenerator()
    # Force rebuild if vector store is empty
    generator.build_vector_store(force_rebuild=False)
    
    # Check if vector store has data, if not force rebuild
    if generator.vectorstore and generator.vectorstore._collection.count() == 0:
        print("⚠️ Vector store is empty, rebuilding...")
        generator.build_vector_store(force_rebuild=True)
    
    print("✅ Generator initialized and ready!")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "RAG Quiz Generator",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    if generator is None:
        return {"status": "initializing"}
    
    return {
        "status": "healthy",
        "vectorstore_ready": generator.vectorstore is not None,
        "embeddings_model": "text-embedding-004",
        "llm_model": "gemini-1.5-flash"
    }

@app.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(request: QuizRequest):
    """
    Generate quiz questions using RAG pipeline.
    
    Args:
        request: QuizRequest with filters and parameters
        
    Returns:
        QuizResponse with generated questions
    """
    if generator is None:
        raise HTTPException(status_code=503, detail="Generator not initialized")
    
    try:
        questions = generator.generate_questions(
            subject=request.subject,
            topic=request.topic,
            difficulty=request.difficulty,
            count=request.count,
            use_compression=request.use_compression
        )
        
        if not questions:
            raise HTTPException(
                status_code=404,
                detail="No questions generated. Try adjusting filters or parameters."
            )
        
        return QuizResponse(
            success=True,
            questions=questions,
            count=len(questions),
            metadata={
                "subject": request.subject,
                "topic": request.topic,
                "difficulty": request.difficulty,
                "compression_used": request.use_compression
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.post("/retrieve-similar")
async def retrieve_similar(
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    k: int = 10
):
    """
    Retrieve similar questions without generating new ones.
    
    Args:
        subject: Filter by subject
        topic: Filter by topic
        difficulty: Filter by difficulty
        k: Number of documents to retrieve
        
    Returns:
        Retrieved documents with metadata
    """
    if generator is None:
        raise HTTPException(status_code=503, detail="Generator not initialized")
    
    try:
        docs = generator.retrieve_similar_questions(
            subject=subject,
            topic=topic,
            difficulty=difficulty,
            k=k
        )
        
        return {
            "success": True,
            "count": len(docs),
            "documents": [
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata
                }
                for doc in docs
            ]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {str(e)}")

@app.post("/rebuild-vectorstore")
async def rebuild_vectorstore():
    """
    Force rebuild vector store from data files.
    
    Note: This is a long-running operation (2-5 minutes).
    """
    if generator is None:
        raise HTTPException(status_code=503, detail="Generator not initialized")
    
    try:
        generator.build_vector_store(force_rebuild=True)
        return {
            "success": True,
            "message": "Vector store rebuilt successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rebuild failed: {str(e)}")

@app.post("/add-questions")
async def add_questions_to_vectorstore(questions: List[Dict[str, Any]]):
    """
    Add new generated questions to the vector store for future use.
    
    Args:
        questions: List of question dictionaries with format:
            {
                "question": str,
                "options": {"A": str, "B": str, "C": str, "D": str},
                "correct_answer": str,
                "subject": str,
                "topic": str,
                "difficulty": str (optional)
            }
    
    Returns:
        Success status and count of questions added
    """
    if generator is None:
        raise HTTPException(status_code=503, detail="Generator not initialized")
    
    try:
        # Add questions to vector store
        count = generator.add_questions_to_vectorstore(questions)
        
        return {
            "success": True,
            "message": f"Added {count} questions to vector store",
            "count": count
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add questions: {str(e)}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000, help="Port to run the server on")
    args = parser.parse_args()
    uvicorn.run(app, host="0.0.0.0", port=args.port)
