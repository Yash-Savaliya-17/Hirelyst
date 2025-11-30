# Quick Start Commands

## Prerequisites
Make sure Docker Desktop is installed and running on your machine.

## 1. Start MinIO
```powershell
cd PrepArc-AIML-kaushal
docker-compose up minio -d
```

## 2. Verify MinIO is Running
- Open http://localhost:9001 in your browser
- Login with username: `minioadmin`, password: `minioadmin123`

## 3. Test API Connection
```powershell
# Test MinIO API endpoint
curl http://localhost:9000
```

## 4. Configure Your Applications

### Backend (.env in PrepArc-Backend-jalay/)
```env
USE_MINIO=true
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_NAME=preparcbucket
```

### Frontend (.env in PrepArc-Frontend-mit/)
```env
VITE_USE_MINIO=true
VITE_MINIO_ENDPOINT=http://localhost:9000
VITE_MINIO_ACCESS_KEY=minioadmin
VITE_MINIO_SECRET_KEY=minioadmin123
VITE_MINIO_BUCKET_NAME=preparcbucket
```

## 5. Start Your Applications
```powershell
# Backend
cd PrepArc-Backend-jalay
npm run start:dev

# Frontend (in another terminal)
cd PrepArc-Frontend-mit
npm run dev
```

The bucket will be automatically created when the backend starts for the first time.