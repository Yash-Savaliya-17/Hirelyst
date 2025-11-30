# PrepArc Complete Startup Guide

## Starting the Complete Application

### Option 1: Start Everything at Once (Recommended)

#### Step 1: Start ML Services (including RAG)
```powershell
cd ml
.\start-ml-services.ps1
```

Wait for all services to start (about 30-60 seconds). The RAG service will build its vector store on first start.

#### Step 2: Start Backend
```powershell
cd Backend
npm run start:dev
```

#### Step 3: Start Frontend
```powershell
cd Frontend
npm run dev
```

### Option 2: Manual Docker Commands

#### Start ML Services
```powershell
cd ml
docker-compose up -d
```

#### Check Service Status
```powershell
docker-compose ps
```

#### View RAG Logs (to see vector store building)
```powershell
docker-compose logs -f quiz-rag
```

## Stopping Everything

### Stop ML Services
```powershell
cd ml
.\stop-ml-services.ps1
```

Or manually:
```powershell
cd ml
docker-compose down
```

### Stop Backend
Press `Ctrl+C` in the terminal running the backend

### Stop Frontend
Press `Ctrl+C` in the terminal running the frontend

## Service URLs After Startup

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:3000 |
| **RAG Quiz** | http://localhost:8001 |
| Traditional Quiz | http://localhost:3003 |
| MinIO Console | http://localhost:9001 |

## How Quiz Generation Works Now

1. User generates quiz from Frontend (http://localhost:5173)
2. Frontend calls Backend API (http://localhost:3000)
3. Backend tries **RAG Service first** (http://localhost:8001)
   - Uses vector store with 3,493 questions
   - AI-powered generation with Google Gemini
4. If RAG fails → **Falls back to Traditional Service** (http://localhost:3003)
5. Questions saved to PostgreSQL database
6. Results displayed in Frontend

## Verifying RAG Integration

### Test RAG Service Health
```powershell
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "vectorstore_ready": true,
  "embeddings_model": "text-embedding-004",
  "llm_model": "gemini-1.5-flash"
}
```

### Test RAG Quiz Generation
```powershell
curl -X POST http://localhost:8001/generate-quiz `
  -H "Content-Type: application/json" `
  -d '{
    "subject": "Machine Learning",
    "topic": "Neural Networks",
    "difficulty": "medium",
    "count": 5
  }'
```

## First-Time Setup Checklist

- [ ] Docker Desktop is installed and running
- [ ] PostgreSQL is running (for Backend database)
- [ ] Node.js is installed (for Backend & Frontend)
- [ ] Python 3.11+ is installed (for ML services)
- [ ] All npm dependencies installed:
  ```powershell
  cd Backend; npm install
  cd Frontend; npm install
  ```
- [ ] Backend `.env` file configured with database credentials
- [ ] ML services `.env` files have correct API keys

## Common Issues

### RAG Service Not Starting

**Problem**: RAG container fails to start

**Solution**:
```powershell
cd ml
docker-compose logs quiz-rag
docker-compose build quiz-rag --no-cache
docker-compose up -d quiz-rag
```

### Vector Store Building Too Long

**Problem**: First startup takes 2-5 minutes

**Solution**: This is normal! The RAG service is building embeddings for 3,493 questions. Subsequent starts will be fast (~5 seconds) as the vector store is persisted.

### Backend Not Using RAG

**Problem**: Backend still using traditional quiz service

**Solution**:
1. Verify RAG service is running: `curl http://localhost:8001/health`
2. Check Backend `.env` has: `RAG_QUIZ_SERVICE_URL=http://localhost:8001`
3. Restart Backend: `Ctrl+C` then `npm run start:dev`

### Port Already in Use

**Problem**: Port 8001 already in use

**Solutions**:
- Find what's using the port:
  ```powershell
  netstat -ano | findstr :8001
  ```
- Kill the process or change RAG port in `docker-compose.yml`:
  ```yaml
  quiz-rag:
    ports:
      - "8002:8000"  # Change 8001 to 8002
  ```
  Then update Backend `.env`: `RAG_QUIZ_SERVICE_URL=http://localhost:8002`

## Development Workflow

### Daily Startup
```powershell
# Terminal 1: ML Services
cd ml
.\start-ml-services.ps1

# Terminal 2: Backend
cd Backend
npm run start:dev

# Terminal 3: Frontend
cd Frontend
npm run dev
```

### When Updating RAG Code
```powershell
cd ml
docker-compose build quiz-rag
docker-compose restart quiz-rag
docker-compose logs -f quiz-rag
```

### When Adding New Questions to data/
```powershell
# Rebuild vector store
curl -X POST http://localhost:8001/rebuild-vectorstore
```

## Monitoring & Logs

### View All ML Service Logs
```powershell
cd ml
docker-compose logs -f
```

### View RAG Logs Only
```powershell
cd ml
docker-compose logs -f quiz-rag
```

### View Backend Logs
Logs appear in the terminal running `npm run start:dev`

### View Frontend Logs
Logs appear in the terminal running `npm run dev`

## Architecture Overview

```
┌──────────────────────────────────────────────────┐
│            Frontend (React + Vite)               │
│            http://localhost:5173                 │
└─────────────────────┬────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────┐
│         Backend (NestJS + PostgreSQL)            │
│            http://localhost:3000                 │
└──────┬───────────────────────────────┬───────────┘
       │                               │
       ▼                               ▼
┌──────────────────┐         ┌──────────────────┐
│  RAG Quiz Gen    │         │ Traditional Quiz │
│  Port: 8001      │         │  Port: 3003      │
│  (PRIMARY)       │         │  (FALLBACK)      │
│  ✓ Vector Store  │         │  ✓ Gemini API    │
│  ✓ 3,493 Q's     │         │                  │
└──────────────────┘         └──────────────────┘
         │
         ▼
┌──────────────────┐
│   ChromaDB       │
│   Vector Store   │
└──────────────────┘
```
