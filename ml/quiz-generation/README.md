# Quiz Generation Module

This folder contains all quiz generation services organized into subfolders.

## 📁 Folder Structure

```
quiz-generation/
├── mcq-rag/           # MCQ RAG service (format examples)
│   ├── api.py
│   ├── rag_quiz_generator.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── chroma_db/     # Vector store for MCQ data
│
├── theory-rag/        # Theory RAG service (conceptual context)
│   ├── api.py
│   ├── rag_theory_generator.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── chroma_db_theory/  # Vector store for theory data
│
└── orchestrator/      # Combines both RAGs for optimal generation
    ├── api.py
    ├── dual_rag_orchestrator.py
    ├── Dockerfile
    └── requirements.txt
```

## 🎯 Services Overview

### 1. MCQ RAG (Port 8001)
- **Purpose**: Provides MCQ format examples using RAG
- **Data Source**: `data/MCQ/*.json` (3,493 questions)
- **Vector Store**: ChromaDB at `mcq-rag/chroma_db/`
- **Technology**: FastAPI + LangChain + ChromaDB

### 2. Theory RAG (Port 8002)
- **Purpose**: Provides theoretical context and concepts
- **Data Source**: `data/Theory/*.json` (9 theory files)
- **Vector Store**: ChromaDB at `theory-rag/chroma_db_theory/`
- **Technology**: FastAPI + LangChain + ChromaDB

### 3. Orchestrator (Port 8003)
- **Purpose**: Combines MCQ + Theory RAG for high-quality generation
- **Architecture**: Parallel retrieval from both RAGs
- **Integration**: Merges contexts and sends to Gemini
- **Technology**: FastAPI + Async HTTP calls

## 🚀 Quick Start

### Using Docker Compose (Recommended)
```powershell
# From ml/ directory
docker-compose up -d quiz-rag quiz-rag-theory quiz-orchestrator

# Check health
curl http://localhost:8003/check-services
```

### Using Startup Script
```powershell
# From ml/ directory
.\start-dual-rag.ps1
```

## 📊 Service Health Checks

```powershell
# MCQ RAG
curl http://localhost:8001/health

# Theory RAG
curl http://localhost:8002/health

# Orchestrator
curl http://localhost:8003/health
curl http://localhost:8003/check-services
```

## 🔧 Development

### Running Individual Services

#### MCQ RAG
```bash
cd mcq-rag
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

#### Theory RAG
```bash
cd theory-rag
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

#### Orchestrator
```bash
cd orchestrator
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

## 🔑 Environment Variables

Each service requires a `.env` file:

### mcq-rag/.env
```env
GEMINI_API_KEY=your_key_here
```

### theory-rag/.env
```env
GEMINI_API_KEY=your_key_here
```

### orchestrator/.env
```env
GEMINI_API_KEY=your_key_here
MCQ_RAG_URL=http://quiz-rag:8000
THEORY_RAG_URL=http://quiz-rag-theory:8000
```

## 📈 Data Flow

```
User Request
    ↓
Backend (NestJS)
    ↓
┌─────────────────────────────────┐
│   Orchestrator (Port 8003)      │
└─────────────────────────────────┘
    ↓                    ↓
┌──────────────┐    ┌──────────────┐
│  MCQ RAG     │    │  Theory RAG  │
│  (Port 8001) │    │  (Port 8002) │
└──────────────┘    └──────────────┘
    ↓                    ↓
┌──────────────┐    ┌──────────────┐
│ ChromaDB     │    │ ChromaDB     │
│ (MCQ Data)   │    │ (Theory Data)│
└──────────────┘    └──────────────┘
         ↓                ↓
         └────────┬───────┘
                  ↓
          Combined Context
                  ↓
         ┌────────────────┐
         │  Gemini AI     │
         │  Generation    │
         └────────────────┘
                  ↓
         Generated Quiz Questions
```

## 🎯 Fallback Strategy

The backend implements a three-tier fallback:

1. **Primary**: Orchestrator (8003) - Combines both RAGs or degrades gracefully
2. **Secondary**: MCQ RAG (8001) - Uses MCQ examples only
3. **Fallback**: Orchestrator (no retrieval) - Pure generation when RAGs unavailable

## 📚 Documentation

- **Setup Guide**: `../DUAL_RAG_SETUP.md`
- **Quick Start**: `../../QUICK_START_DUAL_RAG.md`
- **Implementation Details**: `../../IMPLEMENTATION_SUMMARY.md`

## 🛠️ Troubleshooting

### Vector stores not building?
```powershell
curl -X POST http://localhost:8001/rebuild-vectorstore  # MCQ
curl -X POST http://localhost:8002/rebuild-vectorstore  # Theory
```

### Services not connecting?
```powershell
# Check if all services are up
docker-compose ps

# Check orchestrator connectivity
curl http://localhost:8003/check-services
```

### Need fresh start?
```powershell
# Stop and remove everything
docker-compose down -v

# Rebuild and start
docker-compose build --no-cache quiz-rag quiz-rag-theory quiz-orchestrator
docker-compose up -d quiz-rag quiz-rag-theory quiz-orchestrator
```
