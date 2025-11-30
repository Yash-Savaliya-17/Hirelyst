# RAG Quiz Generation Docker Setup

## Overview
The RAG (Retrieval-Augmented Generation) quiz module is now integrated with your ML Docker container services. It will automatically start with all other ML services.

## Quick Start

### Start All ML Services (including RAG)
```powershell
cd ml
.\start-ml-services.ps1
```

Or manually:
```powershell
cd ml
docker-compose up -d
```

### Stop All Services
```powershell
cd ml
.\stop-ml-services.ps1
```

Or manually:
```powershell
cd ml
docker-compose down
```

## Service URLs

| Service | URL | Port |
|---------|-----|------|
| **RAG Quiz Generation** | http://localhost:8001 | 8001 |
| Quiz Generation (Traditional) | http://localhost:3003 | 3003 |
| Analysis | http://localhost:3001 | 3001 |
| Interview Question | http://localhost:3002 | 3002 |
| Resume ATS | http://localhost:3004 | 3004 |
| Resume Parser | http://localhost:3005 | 3005 |
| Speech to Text | http://localhost:3006 | 3006 |
| Facial Expression | http://localhost:3008 | 3008 |
| MinIO Console | http://localhost:9001 | 9001 |

## RAG Service Endpoints

### Health Check
```bash
curl http://localhost:8001/health
```

### Generate Quiz
```bash
curl -X POST http://localhost:8001/generate-quiz \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Machine Learning",
    "topic": "Neural Networks",
    "difficulty": "medium",
    "count": 5
  }'
```

## Backend Integration

The backend automatically uses RAG service when generating quizzes:

1. **Primary**: RAG Quiz Service (port 8001) - Uses vector store with 3,493 questions
2. **Fallback**: Traditional Quiz Service (port 3003) - If RAG fails

Configuration in `Backend/.env`:
```env
RAG_QUIZ_SERVICE_URL=http://localhost:8001
QUIZ_GEN_SERVER=http://localhost:3003
```

## Docker Commands

### View RAG Service Logs
```powershell
docker-compose logs -f quiz-rag
```

### Restart RAG Service Only
```powershell
docker-compose restart quiz-rag
```

### Rebuild RAG Service
```powershell
docker-compose build quiz-rag
docker-compose up -d quiz-rag
```

### Check Service Status
```powershell
docker-compose ps
```

## Vector Store

- The RAG service uses ChromaDB vector store
- Data is persisted in `ml/quiz-rag/chroma_db/`
- On first start, it builds the vector store from JSON files in `data/` directory
- Contains 3,493 questions from:
  - cs_all_mcqs.json (744 questions)
  - cyber_security_mcqs.json (170 questions)
  - ML_DL_mcqs.json (2,579 questions)

## Environment Variables

Edit `ml/quiz-rag/.env` to configure:

```env
GEMINI_API_KEY=your_api_key_here
CHROMA_PERSIST_DIR=/app/chroma_db
DATA_DIR=/app/data
```

## Troubleshooting

### RAG service not starting
```powershell
# Check logs
docker-compose logs quiz-rag

# Rebuild the image
docker-compose build quiz-rag --no-cache
docker-compose up -d quiz-rag
```

### Vector store not loading
```powershell
# Remove old vector store and rebuild
Remove-Item -Recurse -Force .\quiz-rag\chroma_db
docker-compose restart quiz-rag
```

### Backend not connecting to RAG
1. Check if RAG service is running: `curl http://localhost:8001/health`
2. Verify `RAG_QUIZ_SERVICE_URL` in `Backend/.env`
3. Restart backend: `cd Backend; npm run start:dev`

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Backend (NestJS)                  │
│                   Port: 3000                        │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
       ┌───────▼──────┐      ┌────────▼─────────┐
       │ RAG Service  │      │ Traditional Quiz │
       │ Port: 8001   │      │ Port: 3003       │
       │ (Primary)    │      │ (Fallback)       │
       └──────────────┘      └──────────────────┘
```

## Development

### Run RAG Service Standalone (without Docker)
```powershell
cd ml\quiz-rag
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python api.py --port 8001
```

### Update Dependencies
Edit `ml/quiz-rag/requirements.txt` then rebuild:
```powershell
docker-compose build quiz-rag --no-cache
docker-compose up -d quiz-rag
```
