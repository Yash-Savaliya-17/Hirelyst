# 🚀 Quick Start - Dual RAG Quiz System

## Prerequisites
- ✅ Docker Desktop running
- ✅ Node.js installed
- ✅ PostgreSQL running
- ✅ GEMINI_API_KEY available

---

## Step 1: Setup Environment (One-time)

### Copy API Key to all services:
```powershell
# Get your GEMINI_API_KEY from ml/analysis/.env
# Copy it to these files:

# ml/quiz-rag-theory/.env
GEMINI_API_KEY=your_key_here
THEORY_DATA_DIR=/app/data/Theory

# ml/quiz-orchestrator/.env
GEMINI_API_KEY=your_key_here
MCQ_RAG_URL=http://quiz-rag:8000
THEORY_RAG_URL=http://quiz-rag-theory:8000
```

### Add to Backend/.env:
```env
ORCHESTRATOR_SERVICE_URL=http://localhost:8003
RAG_QUIZ_SERVICE_URL=http://localhost:8001
QUIZ_GEN_SERVER=http://localhost:3003
```

---

## Step 2: Start Dual RAG Services

```powershell
cd ml
.\start-dual-rag.ps1
```

This will:
- Build Docker images
- Start 3 services (MCQ RAG, Theory RAG, Orchestrator)
- Check health of all services

**Wait 2-5 minutes on first run** (building vector stores)

---

## Step 3: Verify Services

```powershell
# Check orchestrator
curl http://localhost:8003/health

# Check service connectivity
curl http://localhost:8003/check-services

# Expected output:
# {
#   "mcq_rag": {"status": "healthy"},
#   "theory_rag": {"status": "healthy"}
# }
```

---

## Step 4: Start Backend & Frontend

### Terminal 1 - Backend:
```powershell
cd Backend
npm run start:dev
```

### Terminal 2 - Frontend:
```powershell
cd Frontend
npm run dev
```

---

## Step 5: Test Quiz Generation

### Option A: Via Frontend
1. Open http://localhost:5173
2. Navigate to Quiz Creation
3. Select subject/topic
4. Generate quiz
5. See enhanced questions!

### Option B: Via API
```powershell
curl -X POST http://localhost:8003/generate-quiz `
  -H "Content-Type: application/json" `
  -d '{
    "subject": "Data Structures",
    "topic": "algorithms",
    "subtopic": "sorting",
    "difficulty": "medium",
    "count": 3
  }'
```

---

## 📊 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 3000 | http://localhost:3000 |
| Orchestrator | 8003 | http://localhost:8003 |
| MCQ RAG | 8001 | http://localhost:8001 |
| Theory RAG | 8002 | http://localhost:8002 |
| Traditional | 3003 | http://localhost:3003 |

---

## 🔍 Check Logs

```powershell
# View all RAG logs
docker-compose logs -f quiz-rag quiz-rag-theory quiz-orchestrator

# View specific service
docker-compose logs -f quiz-orchestrator

# Backend logs (in terminal running npm)
# Frontend logs (in terminal running npm)
```

---

## 🛑 Stop Services

```powershell
# Stop ML services
cd ml
docker-compose down

# Stop Backend (Ctrl+C in terminal)
# Stop Frontend (Ctrl+C in terminal)
```

---

## ⚠️ Troubleshooting

### Services not starting?
```powershell
# Check Docker is running
docker ps

# Rebuild images
cd ml
docker-compose build --no-cache quiz-rag-theory quiz-orchestrator
docker-compose up -d
```

### Vector stores not building?
```powershell
# Force rebuild
curl -X POST http://localhost:8001/rebuild-vectorstore
curl -X POST http://localhost:8002/rebuild-vectorstore

# Wait 5 minutes, then check
curl http://localhost:8001/stats
curl http://localhost:8002/stats
```

### Orchestrator can't reach RAG services?
```powershell
# Check connectivity
curl http://localhost:8003/check-services

# Restart orchestrator
docker-compose restart quiz-orchestrator
```

---

## ✅ Success Checklist

- [ ] All .env files have GEMINI_API_KEY
- [ ] Docker services are running (`docker ps`)
- [ ] MCQ RAG is healthy (http://localhost:8001/health)
- [ ] Theory RAG is healthy (http://localhost:8002/health)
- [ ] Orchestrator is healthy (http://localhost:8003/health)
- [ ] Backend is running (port 3000)
- [ ] Frontend is running (port 5173)
- [ ] Can generate quiz from frontend
- [ ] Questions have detailed explanations

---

## 🎉 You're Ready!

The dual RAG system is now running and generating high-quality quizzes with:
- ✅ MCQ format from examples
- ✅ Theory knowledge from context
- ✅ Accurate, detailed explanations
- ✅ Contextually relevant questions

**Happy quizzing!** 🚀

---

**Need help?** Check `IMPLEMENTATION_SUMMARY.md` for details.
