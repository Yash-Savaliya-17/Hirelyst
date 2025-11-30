# Integration Guide: RAG Quiz Generator with Backend

## Overview

This guide shows how to integrate the RAG Quiz Generator with the existing PrepArc backend (NestJS).

## Architecture Options

### Option 1: Direct FastAPI Microservice (Recommended)

Run RAG as a separate microservice that the NestJS backend calls via HTTP.

**Advantages:**
- Language separation (Python for ML, TypeScript for backend)
- Independent scaling
- Easy to maintain and update
- Already has FastAPI dependencies

**Setup:**

1. Start RAG API server:
```powershell
cd ml/quiz-rag
.\venv\Scripts\Activate.ps1
python api.py --rebuild --port 8001
```

2. From NestJS backend, call the API:

```typescript
// Backend/src/modules/quiz/quiz.service.ts
import { Injectable, HttpService } from '@nestjs/common';

@Injectable()
export class QuizService {
  constructor(private httpService: HttpService) {}

  async generateQuizWithRAG(
    subject?: string,
    topic?: string,
    difficulty?: string,
    count: number = 5
  ) {
    const response = await this.httpService
      .post('http://localhost:8001/api/generate-quiz', {
        subject,
        topic,
        difficulty,
        count,
        use_compression: false // Set true for better quality
      })
      .toPromise();
    
    return response.data.questions;
  }
}
```

3. Add HTTP module to quiz module:
```typescript
// Backend/src/modules/quiz/quiz.module.ts
import { Module, HttpModule } from '@nestjs/common';
import { QuizService } from './quiz.service';

@Module({
  imports: [HttpModule],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
```

---

### Option 2: Python Subprocess

Execute Python script directly from NestJS.

**Advantages:**
- No separate server needed
- Simpler deployment

**Disadvantages:**
- Slower (process startup overhead)
- More complex error handling

**Implementation:**

```typescript
// Backend/src/modules/quiz/quiz.service.ts
import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class QuizService {
  private readonly ragScriptPath = path.join(
    __dirname,
    '../../../../ml/quiz-rag/venv/Scripts/python.exe'
  );
  
  private readonly ragGenerator = path.join(
    __dirname,
    '../../../../ml/quiz-rag/rag_quiz_generator.py'
  );

  async generateQuizWithRAG(
    subject?: string,
    topic?: string,
    difficulty?: string,
    count: number = 5
  ): Promise<any[]> {
    // Create temp file for output
    const tempFile = path.join(__dirname, `quiz_${Date.now()}.json`);
    
    // Build command
    const args = [
      this.ragGenerator,
      `--output "${tempFile}"`,
      `--count ${count}`,
    ];
    
    if (subject) args.push(`--subject "${subject}"`);
    if (topic) args.push(`--topic "${topic}"`);
    if (difficulty) args.push(`--difficulty ${difficulty}`);
    
    const command = `"${this.ragScriptPath}" ${args.join(' ')}`;
    
    try {
      // Execute Python script
      await execAsync(command);
      
      // Read generated questions
      const data = await fs.readFile(tempFile, 'utf-8');
      const questions = JSON.parse(data);
      
      // Cleanup temp file
      await fs.unlink(tempFile);
      
      return questions;
    } catch (error) {
      throw new Error(`RAG generation failed: ${error.message}`);
    }
  }
}
```

---

### Option 3: Shared Queue (Advanced)

Use RabbitMQ or Redis Queue for async quiz generation.

**Advantages:**
- Non-blocking
- Job queuing and retry
- Scalable

**Implementation:**

```typescript
// Producer (NestJS Backend)
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class QuizService {
  constructor(@InjectQueue('quiz-generation') private quizQueue: Queue) {}

  async generateQuizWithRAG(params: any) {
    const job = await this.quizQueue.add('generate-rag-quiz', params);
    return { jobId: job.id, status: 'processing' };
  }
  
  async getQuizStatus(jobId: string) {
    const job = await this.quizQueue.getJob(jobId);
    return {
      status: await job.getState(),
      result: job.returnvalue
    };
  }
}
```

```python
# Consumer (Python Worker)
# ml/quiz-rag/worker.py
import redis
import json
from rag_quiz_generator import RAGQuizGenerator

r = redis.Redis(host='localhost', port=6379, db=0)
generator = RAGQuizGenerator()
generator.build_vector_store()

def process_quiz_request(job_data):
    questions = generator.generate_questions(
        subject=job_data.get('subject'),
        topic=job_data.get('topic'),
        difficulty=job_data.get('difficulty'),
        count=job_data.get('count', 5)
    )
    return questions

# Listen for jobs
while True:
    job = r.blpop('quiz-generation-queue')
    job_data = json.loads(job[1])
    result = process_quiz_request(job_data)
    r.set(f"quiz-result:{job_data['job_id']}", json.dumps(result))
```

---

## API Endpoints

### FastAPI Service Endpoints

**Base URL**: `http://localhost:8001`

#### 1. Generate Quiz
```http
POST /api/generate-quiz
Content-Type: application/json

{
  "subject": "C Programming",
  "topic": "Arrays",
  "difficulty": "medium",
  "count": 5,
  "use_compression": false
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "What is an array?",
      "options": ["A", "B", "C", "D"],
      "correct_option_index": 0,
      "explanation": "...",
      "subject": "C Programming",
      "topic": "Arrays",
      "difficulty": "medium"
    }
  ],
  "count": 5,
  "request": { ... }
}
```

#### 2. Health Check
```http
GET /
```

#### 3. Rebuild Vector Store
```http
POST /api/rebuild-vector-store
```

---

## NestJS Integration Example

### Complete Service Implementation

```typescript
// Backend/src/modules/quiz/rag-quiz.service.ts
import { Injectable, HttpService, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RAGQuizOptions {
  subject?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
  useCompression?: boolean;
}

@Injectable()
export class RAGQuizService {
  private readonly logger = new Logger(RAGQuizService.name);
  private readonly ragApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ragApiUrl = this.configService.get<string>(
      'RAG_API_URL',
      'http://localhost:8001'
    );
  }

  async generateQuiz(options: RAGQuizOptions) {
    this.logger.log(`Generating quiz: ${JSON.stringify(options)}`);

    try {
      const response = await this.httpService
        .post(`${this.ragApiUrl}/api/generate-quiz`, {
          subject: options.subject,
          topic: options.topic,
          difficulty: options.difficulty,
          count: options.count || 5,
          use_compression: options.useCompression || false,
        })
        .toPromise();

      this.logger.log(`Generated ${response.data.count} questions`);
      return response.data.questions;
    } catch (error) {
      this.logger.error(`RAG quiz generation failed: ${error.message}`);
      throw new Error('Failed to generate quiz with RAG');
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.httpService
        .get(`${this.ragApiUrl}/`)
        .toPromise();
      return response.data.vector_store_ready;
    } catch {
      return false;
    }
  }

  async rebuildVectorStore() {
    this.logger.log('Rebuilding RAG vector store...');
    try {
      const response = await this.httpService
        .post(`${this.ragApiUrl}/api/rebuild-vector-store`)
        .toPromise();
      this.logger.log(`Vector store rebuilt: ${response.data.questions_indexed} questions`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to rebuild vector store: ${error.message}`);
      throw error;
    }
  }
}
```

### Controller Integration

```typescript
// Backend/src/modules/quiz/quiz.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { RAGQuizService } from './rag-quiz.service';

@Controller('quiz')
export class QuizController {
  constructor(private readonly ragQuizService: RAGQuizService) {}

  @Post('generate-rag')
  async generateRAGQuiz(@Body() body: any) {
    return this.ragQuizService.generateQuiz({
      subject: body.subject,
      topic: body.topic,
      difficulty: body.difficulty,
      count: body.count,
      useCompression: body.useCompression,
    });
  }

  @Get('rag-health')
  async checkRAGHealth() {
    const isHealthy = await this.ragQuizService.checkHealth();
    return { status: isHealthy ? 'healthy' : 'unhealthy' };
  }
}
```

---

## Docker Deployment

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./Backend
    ports:
      - "3000:3000"
    environment:
      - RAG_API_URL=http://rag-service:8001
    depends_on:
      - rag-service
  
  rag-service:
    build: ./ml/quiz-rag
    ports:
      - "8001:8001"
    volumes:
      - ./data:/app/data
      - ./ml/quiz-rag/chroma_db:/app/chroma_db
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    command: python api.py --host 0.0.0.0 --port 8001
```

### Dockerfile for RAG Service

```dockerfile
# ml/quiz-rag/Dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY rag_quiz_generator.py api.py ./
COPY ../analysis/.env .env

EXPOSE 8001

CMD ["python", "api.py", "--host", "0.0.0.0", "--port", "8001"]
```

---

## Testing

### Test FastAPI Service

```powershell
# Start service
cd ml/quiz-rag
.\venv\Scripts\Activate.ps1
python api.py --port 8001

# Test with curl (new terminal)
curl -X POST http://localhost:8001/api/generate-quiz `
  -H "Content-Type: application/json" `
  -d '{"topic": "Arrays", "count": 3}'
```

### Test from NestJS

```typescript
// Backend/src/modules/quiz/quiz.service.spec.ts
import { Test } from '@nestjs/testing';
import { RAGQuizService } from './rag-quiz.service';

describe('RAGQuizService', () => {
  let service: RAGQuizService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RAGQuizService],
    }).compile();

    service = module.get<RAGQuizService>(RAGQuizService);
  });

  it('should generate quiz questions', async () => {
    const questions = await service.generateQuiz({
      topic: 'Arrays',
      count: 5,
    });

    expect(questions).toHaveLength(5);
    expect(questions[0]).toHaveProperty('question');
    expect(questions[0]).toHaveProperty('options');
    expect(questions[0]).toHaveProperty('correct_option_index');
  });
});
```

---

## Environment Variables

Add to `.env`:

```env
# RAG Service Configuration
RAG_API_URL=http://localhost:8001
GEMINI_API_KEY=your_api_key_here
```

---

## Performance Optimization

### 1. Pre-build Vector Store
```powershell
cd ml/quiz-rag
python rag_quiz_generator.py --rebuild
```

### 2. Disable Compression for Speed
Set `use_compression: false` in API calls

### 3. Cache Generated Quizzes
Implement caching in NestJS:

```typescript
@Injectable()
export class RAGQuizService {
  private cache = new Map<string, any>();

  async generateQuiz(options: RAGQuizOptions) {
    const cacheKey = JSON.stringify(options);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const questions = await this.callRAGAPI(options);
    this.cache.set(cacheKey, questions);
    
    return questions;
  }
}
```

---

## Monitoring

### Add Logging

```typescript
@Injectable()
export class RAGQuizService {
  async generateQuiz(options: RAGQuizOptions) {
    const startTime = Date.now();
    
    try {
      const questions = await this.callRAGAPI(options);
      const duration = Date.now() - startTime;
      
      this.logger.log(`RAG generation took ${duration}ms`);
      return questions;
    } catch (error) {
      this.logger.error(`RAG failed after ${Date.now() - startTime}ms`);
      throw error;
    }
  }
}
```

---

## Troubleshooting

**RAG service not responding:**
- Check if Python service is running: `curl http://localhost:8001/`
- Check vector store exists: `ls ml/quiz-rag/chroma_db`
- Check logs in terminal running `api.py`

**Empty results:**
- Verify filters aren't too restrictive
- Check data files exist in `data/*.json`
- Try without filters first

**Slow generation:**
- Disable compression
- Reduce count
- Pre-build vector store
- Use caching

---

## Next Steps

1. Start RAG FastAPI service
2. Integrate with NestJS backend
3. Test end-to-end flow
4. Add error handling and retries
5. Implement caching
6. Monitor performance
7. Deploy with Docker
