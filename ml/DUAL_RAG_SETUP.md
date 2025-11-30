# Dual RAG Quiz Generation System

## 🎯 Architecture Overview

This system uses **two separate RAG (Retrieval-Augmented Generation) systems** running in parallel to generate high-quality quiz questions:

### **1. MCQ RAG System** (Port 8001)
- **Purpose**: Provide MCQ format examples and patterns
- **Data Source**: `data/MCQ/*.json` (3,493 MCQs)
- **ChromaDB**: `ml/quiz-rag/chroma_db/`
- **What it provides**: Question structure, option format, difficulty patterns

### **2. Theory RAG System** (Port 8002)
- **Purpose**: Provide theoretical context and deep knowledge
- **Data Source**: `data/Theory/*.json` (Theory Q&As)
- **ChromaDB**: `ml/quiz-rag-theory/chroma_db_theory/`
- **What it provides**: Conceptual knowledge, accurate explanations, domain expertise

### **3. Orchestrator Service** (Port 8003)
- **Purpose**: Combine both RAG systems and generate questions
- **Process**:
  1. Calls MCQ RAG (parallel)
  2. Calls Theory RAG (parallel)
  3. Combines contexts
  4. Sends to Google Gemini
  5. Generates high-quality MCQs
  6. Returns structured questions

---

## 🔄 Data Flow

```
User Request (Backend)
    ↓
Orchestrator API (8003)
    ↓
    ├─────────────┬─────────────┐
    ↓             ↓             ↓
MCQ RAG       Theory RAG    [Parallel]
(8001)         (8002)
    ↓             ↓
MCQ ChromaDB  Theory ChromaDB
(3,493 MCQs)  (Theory Q&As)
    ↓             ↓
Retrieve      Retrieve
Examples      Context
    ↓             ↓
    └──────┬──────┘
           ↓
    Combined Context
           ↓
    Google Gemini
    (Generation)
           ↓
   Generated MCQs
           ↓
    ├─────────────┐
    ↓             ↓
PostgreSQL   MCQ ChromaDB ✅
(Permanent)  (For future use)
             
Theory ChromaDB ❌
(Remains unchanged)
```

---

## 📦 Services

| Service | Port | Purpose | Data Source |
|---------|------|---------|-------------|
| **MCQ RAG** | 8001 | Retrieve MCQ examples | `data/MCQ/*.json` |
| **Theory RAG** | 8002 | Retrieve theory context | `data/Theory/*.json` |
| **Orchestrator** | 8003 | Combine & generate | Calls both RAGs |
| **Traditional** | 3003 | Fallback generator | Direct Gemini |

---

## 🚀 Setup & Installation

### **Step 1: Environment Variables**

Copy GEMINI_API_KEY to all service `.env` files:

```powershell
# From ml/analysis/.env, copy to:
# - ml/quiz-rag/.env
# - ml/quiz-rag-theory/.env
# - ml/quiz-orchestrator/.env
```

### **Step 2: Build Docker Images**

```powershell
cd ml
docker-compose build quiz-rag quiz-rag-theory quiz-orchestrator
```

### **Step 3: Start Services**

```powershell
# Start all ML services
cd ml
docker-compose up -d

# Or start specific services
docker-compose up -d quiz-rag quiz-rag-theory quiz-orchestrator
```

### **Step 4: Verify Services**

```powershell
# Check MCQ RAG
curl http://localhost:8001/health

# Check Theory RAG
curl http://localhost:8002/health

# Check Orchestrator
curl http://localhost:8003/health

# Check Orchestrator's connection to both RAGs
curl http://localhost:8003/check-services
```

---

## 🧪 Testing

### **Test Theory RAG**
```powershell
curl -X POST http://localhost:8002/retrieve-theory `
  -H "Content-Type: application/json" `
  -d '{
    "topic": "algorithms",
    "subtopic": "sorting",
    "difficulty": "medium",
    "k": 5
  }'
```

### **Test MCQ RAG**
```powershell
curl -X POST http://localhost:8001/retrieve-similar `
  -H "Content-Type: application/json" `
  -d '{
    "subject": "Data Structures",
    "topic": "Arrays",
    "difficulty": "medium",
    "k": 5
  }'
```

### **Test Dual RAG Generation**
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

## 🔧 Backend Configuration

Add to `Backend/.env`:

```env
ORCHESTRATOR_SERVICE_URL=http://localhost:8003
RAG_QUIZ_SERVICE_URL=http://localhost:8001
```

The backend will:
1. **Try Orchestrator first** (Dual RAG with theory context)
2. **Fallback to MCQ RAG** (if orchestrator fails)
3. **Fallback to Traditional** (if both RAGs fail)

---

## 📊 Benefits of Dual RAG

### **Before (Single MCQ RAG)**
- Only MCQ examples as context
- Generic explanations
- Limited conceptual depth

### **After (Dual RAG with Theory)**
- ✅ MCQ format + Theory knowledge
- ✅ Accurate, detailed explanations
- ✅ Contextually relevant questions
- ✅ Better distractors (wrong options)
- ✅ Tests deep understanding

---

## 🗂️ File Structure

```
ml/
├── quiz-rag/                   # MCQ RAG Service
│   ├── rag_quiz_generator.py
│   ├── api.py
│   ├── chroma_db/             # MCQ vector store
│   └── Dockerfile
│
├── quiz-rag-theory/           # Theory RAG Service (NEW)
│   ├── rag_theory_generator.py
│   ├── api.py
│   ├── chroma_db_theory/      # Theory vector store
│   └── Dockerfile
│
├── quiz-orchestrator/         # Orchestrator Service (NEW)
│   ├── dual_rag_orchestrator.py
│   ├── api.py
│   └── Dockerfile
│
└── docker-compose.yml         # All services
```

---

## 🔍 Monitoring & Logs

### **View Orchestrator Logs**
```powershell
docker-compose logs -f quiz-orchestrator
```

### **View All RAG Logs**
```powershell
docker-compose logs -f quiz-rag quiz-rag-theory quiz-orchestrator
```

### **Check Vector Store Stats**
```powershell
# MCQ RAG stats
curl http://localhost:8001/stats

# Theory RAG stats
curl http://localhost:8002/stats
```

---

## 🛠️ Troubleshooting

### **Problem: Theory RAG not building vector store**
```powershell
# Force rebuild
curl -X POST http://localhost:8002/rebuild-vectorstore
```

### **Problem: Orchestrator can't reach RAG services**
```powershell
# Check service connectivity
curl http://localhost:8003/check-services

# Expected output:
# {
#   "mcq_rag": {"url": "http://quiz-rag:8000", "status": "healthy"},
#   "theory_rag": {"url": "http://quiz-rag-theory:8000", "status": "healthy"}
# }
```

### **Problem: Generated questions have poor quality**
- Ensure both RAG services have built their vector stores
- Check that data files exist in `data/MCQ/` and `data/Theory/`
- Verify GEMINI_API_KEY is valid

---

## 📈 Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Theory vector store build | 2-5 min | First time only |
| MCQ vector store build | 2-5 min | First time only |
| Dual RAG retrieval | <500ms | Parallel execution |
| Question generation | 3-8 sec | Gemini API call |
| **Total** | <10 sec | After initial setup |

---

## 🎓 Next Steps

1. ✅ Start all services
2. ✅ Test orchestrator endpoint
3. ✅ Verify backend integration
4. ✅ Generate quiz from frontend
5. ✅ Compare quality with single RAG

---

**Questions?** Check logs with `docker-compose logs -f [service-name]`
