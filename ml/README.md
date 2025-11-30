# PrepArc ML Services

Machine Learning and AI services for the PrepArc platform.

## 🎯 Quiz Generation Services (NEW - Dual RAG System)

### Architecture
The quiz generation system is now consolidated under `quiz-generation/` with the orchestrator coordinating two RAG services:

1. **MCQ RAG** (Port 8001) – Provides MCQ format examples
2. **Theory RAG** (Port 8002) – Provides conceptual/theoretical depth
3. **Orchestrator** (Port 8003) – Combines contexts or gracefully degrades (can generate without retrieval)

### Quick Start
```powershell
# Start all quiz services (includes vector store building)
.\start-dual-rag.ps1

# Verify health
curl http://localhost:8003/check-services
```

### Services Overview

| Service | Port | Purpose | Data Source |
|---------|------|---------|-------------|
| MCQ RAG | 8001 | MCQ examples & format | `data/MCQ/*.json` |
| Theory RAG | 8002 | Theoretical knowledge | `data/Theory/*.json` |
| Orchestrator | 8003 | Combine & generate / fallback | RAGs + generic prompt |

### Documentation
- **Setup Guide**: `DUAL_RAG_SETUP.md`
- **Quick Start**: `../QUICK_START_DUAL_RAG.md`
- **Implementation Details**: `../IMPLEMENTATION_SUMMARY.md`

---

## 🚀 Other Services

### Analysis Service (Port 3001)
Interview answer analysis and scoring

### Interview Question Service (Port 3002)
AI-powered interview question generation


### Resume Services
- **ATS Score** (Port 3004)
- **Parser** (Port 3005)

### Speech-to-Text (Port 3006)
Audio transcription service

### Facial Expression (Port 3008)
Emotion detection from video

---

## 🔧 Development Setup

### For Individual Services
```bash
# Create virtual environment
python -m venv env

# Activate
env\Scripts\activate  # Windows
source env/bin/activate  # Linux/Mac

# Install requirements
pip install -r requirements.txt

# Run service
uvicorn app:app --reload
```

### For All Services (Docker)
```powershell
# Start all services
docker-compose up -d

# Start quiz generation services only
docker-compose up -d quiz-rag quiz-rag-theory quiz-orchestrator

# View logs
docker-compose logs -f [service-name]

# Stop all
docker-compose down
```

---

## 📊 Service Status

Check health of all services:
```powershell
# Quiz services
curl http://localhost:8001/health  # MCQ RAG
curl http://localhost:8002/health  # Theory RAG
curl http://localhost:8003/health  # Orchestrator
curl http://localhost:8003/check-services  # Check RAG connectivity

# Other services
curl http://localhost:3001/health  # Analysis
curl http://localhost:3002/health  # Interview
```

---

## 🛠️ Troubleshooting

### Vector stores not building?
```powershell
# Force rebuild
curl -X POST http://localhost:8001/rebuild-vectorstore
curl -X POST http://localhost:8002/rebuild-vectorstore
```

### Services not starting?
```powershell
# Rebuild images
docker-compose build --no-cache

# Check logs
docker-compose logs -f [service-name]
```

### Need to reset?
```powershell
# Stop all and remove volumes
docker-compose down -v

# Rebuild everything
docker-compose build --no-cache
docker-compose up -d
```
