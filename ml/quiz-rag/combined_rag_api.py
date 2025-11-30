"""
Combined RAG API - Handles both MCQ and Theory retrieval on single endpoint
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import sys
import os

# Import both RAG generators
from rag_quiz_generator import RAGQuizGenerator
from rag_theory_generator import RAGTheoryGenerator

app = FastAPI(
    title="Combined Quiz RAG API",
    description="Unified RAG service for MCQ examples and Theory context",
    version="2.0.0"
)

# Initialize both generators
mcq_generator = None
theory_generator = None


class RetrievalRequest(BaseModel):
    """Unified retrieval request"""
    subject: Optional[str] = None
    topic: Optional[str] = None
    subtopic: Optional[str] = None
    difficulty: Optional[str] = None
    k: int = Field(20, ge=1, le=50)
    retrieval_type: str = Field("both", description="mcq, theory, or both")


class RetrievalResponse(BaseModel):
    """Unified retrieval response"""
    success: bool
    mcq_examples: Optional[Dict[str, Any]] = None
    theory_context: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any]


@app.on_event("startup")
async def startup_event():
    """Initialize both RAG systems"""
    global mcq_generator, theory_generator
    
    print("🚀 Starting Combined RAG Service...")
    
    # Initialize MCQ RAG
    try:
        mcq_data_dir = os.getenv("MCQ_DATA_DIR", "/app/data/MCQ")
        mcq_generator = RAGQuizGenerator(
            data_dir=mcq_data_dir,
            persist_directory="/app/chroma_db/mcq"
        )
        mcq_generator.build_vector_store()
        print("✅ MCQ RAG initialized")
    except Exception as e:
        print(f"❌ MCQ RAG initialization failed: {e}")
    
    # Initialize Theory RAG
    try:
        theory_data_dir = os.getenv("THEORY_DATA_DIR", "/app/data/Theory")
        theory_generator = RAGTheoryGenerator(
            data_dir=theory_data_dir,
            persist_directory="/app/chroma_db/theory"
        )
        theory_generator.build_vector_store()
        print("✅ Theory RAG initialized")
    except Exception as e:
        print(f"❌ Theory RAG initialization failed: {e}")


@app.get("/")
async def root():
    return {
        "service": "Combined Quiz RAG",
        "version": "2.0.0",
        "endpoints": ["/retrieve", "/health", "/stats", "/rebuild"]
    }


@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "mcq_rag": "ready" if mcq_generator else "not_initialized",
        "theory_rag": "ready" if theory_generator else "not_initialized"
    }


@app.post("/retrieve", response_model=RetrievalResponse)
async def retrieve_context(request: RetrievalRequest):
    """
    Unified retrieval endpoint - get MCQ examples and/or Theory context
    """
    
    mcq_result = None
    theory_result = None
    
    # Retrieve MCQ examples
    if request.retrieval_type in ["mcq", "both"]:
        if not mcq_generator:
            raise HTTPException(503, "MCQ RAG not initialized")
        
        try:
            docs = mcq_generator.retrieve_similar_questions(
                subject=request.subject,
                topic=request.topic,
                difficulty=request.difficulty,
                k=request.k
            )
            mcq_result = {
                "documents": [{"content": doc.page_content, "metadata": doc.metadata} for doc in docs],
                "count": len(docs)
            }
        except Exception as e:
            print(f"❌ MCQ retrieval error: {e}")
            mcq_result = {"documents": [], "count": 0, "error": str(e)}
    
    # Retrieve Theory context
    if request.retrieval_type in ["theory", "both"]:
        if not theory_generator:
            raise HTTPException(503, "Theory RAG not initialized")
        
        try:
            theory_docs = theory_generator.retrieve_relevant_theory(
                topic=request.topic,
                subtopic=request.subtopic,
                difficulty=request.difficulty,
                k=min(request.k // 2, 10)
            )
            
            theory_text = "\n\n".join([
                f"Q: {doc.metadata.get('question', '')}\nA: {doc.metadata.get('answer', '')}"
                for doc in theory_docs
            ])
            
            theory_result = {
                "theory_context": theory_text,
                "documents": [{"content": doc.page_content, "metadata": doc.metadata} for doc in theory_docs],
                "count": len(theory_docs)
            }
        except Exception as e:
            print(f"❌ Theory retrieval error: {e}")
            theory_result = {"theory_context": "", "documents": [], "count": 0, "error": str(e)}
    
    return RetrievalResponse(
        success=True,
        mcq_examples=mcq_result,
        theory_context=theory_result,
        metadata={
            "retrieval_type": request.retrieval_type,
            "subject": request.subject,
            "topic": request.topic
        }
    )


@app.get("/stats")
async def get_stats():
    """Get statistics about vector stores"""
    stats = {}
    
    if mcq_generator and mcq_generator.vectorstore:
        stats["mcq"] = {
            "total_questions": len(mcq_generator.all_questions),
            "status": "ready"
        }
    
    if theory_generator and theory_generator.vectorstore:
        stats["theory"] = {
            "total_theory_items": len(theory_generator.all_theory),
            "status": "ready"
        }
    
    return stats


@app.post("/rebuild")
async def rebuild_vectorstores():
    """Rebuild both vector stores"""
    results = {}
    
    if mcq_generator:
        try:
            mcq_generator.build_vector_store(force_rebuild=True)
            results["mcq"] = "success"
        except Exception as e:
            results["mcq"] = f"failed: {e}"
    
    if theory_generator:
        try:
            theory_generator.build_vector_store(force_rebuild=True)
            results["theory"] = "success"
        except Exception as e:
            results["theory"] = f"failed: {e}"
    
    return results


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
