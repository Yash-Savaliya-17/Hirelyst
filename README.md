Hirelyst

An AI-powered interview preparation platform with:
- **Frontend**: React + Vite
- **Backend**: NestJS + Prisma + PostgreSQL
- **ML Services**: Python microservices (interview generation, quiz generation, analysis, resume, speech, facial expression)
- **Object Storage**: **MinIO** (S3-compatible)

> Security note: this README intentionally uses placeholders only. Keep all real secrets in local `.env` files or a secrets manager.

---

## Core Modules

- **Interview Preparation**
  - AI-generated interview questions
  - Answer/video submission
  - Post-interview analysis
- **Quiz Preparation**
  - Quiz generation orchestrator
  - Optional RAG retrieval from MCQ/Theory corpus
- **Resume Tools**
  - Resume parser
  - ATS scoring
- **Speech & Video Intelligence**
  - Speech-to-text
  - Facial-expression analysis

---

## Repository Structure

```text
Backend/                 NestJS API + Prisma
Frontend/                React application
ml/                      Python ML services + docker-compose
data/                    MCQ and Theory datasets for RAG
scripts/                 Utility scripts
```

---

## Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+
- Docker Desktop
- PostgreSQL

---

## Environment Setup

### 1) Backend
Create/update `Backend/.env`:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db>

# Storage (recommended)
STORAGE_TYPE=minio
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=<your-minio-access-key>
MINIO_SECRET_KEY=<your-minio-secret-key>
MINIO_BUCKET_NAME=preparc
MINIO_REGION=us-east-1

# ML service URLs
ANALYSIS_SERVER=http://localhost:3001/analyze
QUE_GEN_SERVER=http://localhost:3002/api
QUIZ_GEN_SERVER=http://localhost:3003
ORCHESTRATOR_SERVICE_URL=http://localhost:3003
SPEECH_TO_TEXT_SERVER=http://localhost:3007/transcribe
FACIAL_EXPRESSION_SERVER=http://localhost:3008/analyze-video
RESUME_ATS_SERVER=http://localhost:3004
RESUME_PARSER_SERVER=http://localhost:3005

# Optional timeout tuning
INTERVIEW_GEN_TIMEOUT_MS=120000
```

### 2) ML services
Create `.env` files inside each ML service folder where required (for Nebius/API keys and service settings):
- `ml/interview-question/.env`
- `ml/quiz-generation/.env`
- `ml/quiz-rag/.env`
- (and other services if used)

---

## Quick Start (Recommended)

### Step 1: Start ML services (Docker)

```powershell
cd ml
.\start-ml-services.ps1
```

Or manually:

```powershell
cd ml
docker compose up -d
```

### Step 2: Start backend

```powershell
cd Backend
npm install
npm run start:dev
```

### Step 3: Start frontend

```powershell
cd Frontend
npm install
npm run dev
```

---

## Service Endpoints

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Interview Question Service | http://localhost:3002 |
| Quiz Generation Orchestrator | http://localhost:3003 |
| Quiz RAG Service | http://localhost:8001 |
| Analysis Service | http://localhost:3001 |
| Resume ATS | http://localhost:3004 |
| Resume Parser | http://localhost:3005 |
| Speech-to-Text | http://localhost:3007 |
| Facial Expression | http://localhost:3008 |
| MinIO API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 |

> Backend routes use a global prefix: **`/api`**.

---

## MinIO Usage

- Console: http://localhost:9001
- Sign in using the credentials configured in your local environment or deployment secrets.
- Bucket used by backend: `preparc`

If Azure credentials expire, keep `STORAGE_TYPE=minio` in `Backend/.env`.

---

## Development Notes

- **Interview generation latency** is typically driven by external LLM response time.
- **Quiz generation latency** depends on retrieval mode and model response time.
- First-time RAG warm-up can be slower; subsequent calls are faster when vector data is persisted.

---

## Useful Commands

### Docker

```powershell
cd ml
docker compose ps
docker compose logs -f quiz-rag
docker compose down
```

### Backend

```powershell
cd Backend
npm run start:dev
npm run build
npm run test
```

### Frontend

```powershell
cd Frontend
npm run dev
npm run build
npm run preview
```

---

## Troubleshooting

### `Cannot GET /` or `Cannot GET /favicon.ico` in backend logs
Use API routes under `/api/*` (and ensure backend is started correctly).

### Interview requests timeout
- Increase `INTERVIEW_GEN_TIMEOUT_MS` in `Backend/.env`
- Retry with lower question count
- Check `ml-interview-question` container logs

### Quiz buffering
- Check `quiz-generation` and `quiz-rag` container health/logs
- Rebuild stale image when code changes:

```powershell
cd ml
docker compose build quiz-rag
docker compose up -d --no-deps quiz-rag
```

### MinIO login forgotten
Reset credentials in `ml/docker-compose.yml` (`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`) and recreate MinIO container.

### Security checklist before publishing
- Do not commit `.env` files.
- Rotate any API/storage keys that were previously exposed.
- Use placeholders in docs and examples.

---

## License

Internal / project-specific. Add your preferred license before public release.

