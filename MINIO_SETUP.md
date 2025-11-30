# MinIO Setup and Migration Guide

## What is MinIO?
MinIO is an open-source, S3-compatible object storage server that you can run locally or on your own infrastructure. It's perfect for development and provides the same API as AWS S3 without requiring payment details.

## Benefits of Using MinIO instead of AWS S3:
- ✅ **Free**: No payment details required
- ✅ **Local Development**: Run everything locally
- ✅ **S3 Compatible**: Same API as AWS S3
- ✅ **Easy Setup**: Single Docker container
- ✅ **Web Interface**: Built-in management console

## Setup Instructions:

### 1. Start MinIO Server
```bash
cd PrepArc-AIML-kaushal
docker-compose up minio -d
```

### 2. Access MinIO Console
- Open http://localhost:9001 in your browser
- Login with:
  - Username: `minioadmin`
  - Password: `minioadmin123`

### 3. Configure Backend
1. Copy `.env.backend.example` to `PrepArc-Backend-jalay/.env`
2. Set `USE_MINIO=true`
3. Update other required environment variables

### 4. Configure Frontend
1. Copy `.env.frontend.example` to `PrepArc-Frontend-mit/.env`
2. Set `VITE_USE_MINIO=true`
3. Update other required environment variables

### 5. Start Services
```bash
# Start all AI services with MinIO
cd PrepArc-AIML-kaushal
docker-compose up -d

# Start backend
cd ../PrepArc-Backend-jalay
npm run start:dev

# Start frontend
cd ../PrepArc-Frontend-mit
npm run dev
```

## MinIO Console Features:
- **Buckets**: Create and manage storage buckets
- **Objects**: Upload, download, and manage files
- **Access Keys**: Manage API credentials
- **Monitoring**: View usage statistics

## Production Considerations:
- Change default credentials (`minioadmin/minioadmin123`)
- Use environment-specific endpoints
- Consider MinIO clustering for high availability
- Set up proper backup strategies

## Switching Back to AWS S3:
Simply set `USE_MINIO=false` in your environment variables and configure your AWS credentials.