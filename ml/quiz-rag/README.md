# RAG Quiz Generator - LangChain + Google Gemini

High-quality, low-latency RAG-powered Quiz Generation System using LangChain and Google Gemini.

## Architecture

```
Input → Fast Retrieval → Reranking → Pattern Extraction → Compression → LLM Generation → Quality Filters → JSON Output
```

## Features

- **Fast Vector Search**: ChromaDB with Google Gemini embeddings (text-embedding-004)
- **Smart Retrieval**: Metadata filtering (subject, topic, difficulty)
- **Pattern Extraction**: Analyzes retrieved examples for consistency
- **Contextual Compression**: Optional LLM-based compression for better context
- **Quality Validation**: Ensures all generated questions meet format requirements
- **Persistent Storage**: Vector store cached for fast subsequent runs

## Installation

```bash
cd ml/quiz-rag
pip install -r requirements.txt
```

## Environment Setup

Create `.env` file in `ml/analysis/` with:
```
GEMINI_API_KEY=your_api_key_here
```

## Usage

### Initial Setup (Build Vector Store)

First run will load all questions from `data/*.json` and build the vector store:

```bash
python rag_quiz_generator.py --rebuild
```

This creates a `chroma_db/` directory with embeddings for 3493 questions.

### Generate Quiz Questions

**Basic Usage:**
```bash
python rag_quiz_generator.py --topic "Arrays" --count 5
```

**With Filters:**
```bash
python rag_quiz_generator.py \
  --subject "C Programming Mock Tests" \
  --topic "Binary Trees" \
  --difficulty medium \
  --count 10 \
  --output trees_quiz.json
```

**With Contextual Compression:**
```bash
python rag_quiz_generator.py \
  --topic "Stack" \
  --difficulty easy \
  --count 5 \
  --compression
```

## Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--subject` | Filter by subject | Any |
| `--topic` | Filter by topic | Any |
| `--difficulty` | Difficulty level (easy/medium/hard) | Any |
| `--count` | Number of questions to generate | 5 |
| `--rebuild` | Force rebuild vector store | False |
| `--compression` | Use contextual compression | False |
| `--output` | Output JSON file path | generated_quiz.json |

## Output Format

Generated questions are saved as JSON:

```json
[
  {
    "question": "What is the time complexity of binary search?",
    "options": ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
    "correct_option_index": 1,
    "explanation": "Binary search divides the search space in half each iteration",
    "subject": "Data Structures",
    "topic": "Searching",
    "difficulty": "medium"
  }
]
```

## Python API Usage

```python
from rag_quiz_generator import RAGQuizGenerator

# Initialize
generator = RAGQuizGenerator()
generator.build_vector_store()

# Generate questions
questions = generator.generate_questions(
    topic="Algorithms",
    difficulty="hard",
    count=5
)

# Save to file
generator.save_questions(questions, "my_quiz.json")
```

## Performance

- **Vector Store Build**: ~2-5 minutes (first time only)
- **Retrieval**: <100ms for 30 documents
- **Generation**: ~3-8 seconds for 5 questions
- **Total**: <10 seconds per quiz (after initial build)

## Data Source

Loads questions from:
- `data/cs_all_mcqs.json` (2815 questions)
- `data/ML_DL_mcqs.json` (553 questions)
- `data/cyber_security_mcqs.json` (125 questions)

Total: **3493 questions** across multiple topics

## Architecture Details

### 1. Document Processing
- Questions converted to LangChain `Document` objects
- Rich text content includes subject, topic, question, options, explanation
- Metadata: id, subject, topic, difficulty, type, source, num_options, question_length

### 2. Vector Store (ChromaDB)
- Persistent storage in `chroma_db/` directory
- Google Gemini embeddings (text-embedding-004)
- Supports metadata filtering for fast retrieval

### 3. Retrieval Pipeline
- Hybrid search: vector similarity + metadata filters
- Top-k retrieval (default k=30)
- Optional contextual compression with LLM

### 4. Pattern Extraction
- Analyzes retrieved examples for:
  - Average number of options
  - Average question length
  - Difficulty distribution
  - Common topics/subjects

### 5. LLM Generation
- Google Gemini 1.5 Flash for fast generation
- Structured prompt with examples and patterns
- JSON output parsing and validation

### 6. Quality Filters
- Required fields validation
- Option count validation
- Correct answer index validation
- Format compliance checking

## Integration with Quiz Module

### Option 1: Direct Python Import
```python
from ml.quiz_rag.rag_quiz_generator import RAGQuizGenerator

generator = RAGQuizGenerator()
generator.build_vector_store()
questions = generator.generate_questions(topic="Arrays", count=5)
```

### Option 2: FastAPI Service
Create `api.py`:
```python
from fastapi import FastAPI
from rag_quiz_generator import RAGQuizGenerator

app = FastAPI()
generator = RAGQuizGenerator()
generator.build_vector_store()

@app.post("/generate-quiz")
async def generate_quiz(
    subject: str = None,
    topic: str = None,
    difficulty: str = None,
    count: int = 5
):
    questions = generator.generate_questions(
        subject=subject,
        topic=topic,
        difficulty=difficulty,
        count=count
    )
    return {"questions": questions}
```

Run: `uvicorn api:app --reload`

### Option 3: CLI Subprocess
```python
import subprocess
import json

result = subprocess.run([
    "python", "ml/quiz-rag/rag_quiz_generator.py",
    "--topic", "Arrays",
    "--count", "5",
    "--output", "temp_quiz.json"
], capture_output=True)

with open("temp_quiz.json") as f:
    questions = json.load(f)
```

## Troubleshooting

### Embedding Quota Exceeded
If you hit Google's embedding quota limits, you can:
1. Use smaller batches when building vector store
2. Cache the vector store (automatic with ChromaDB)
3. Reduce retrieval count (`k` parameter)

### Model Not Found
Ensure you're using compatible Gemini models:
- Embeddings: `models/text-embedding-004`
- Generation: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-pro`

### No Questions Generated
- Check if vector store has data: `ls chroma_db/`
- Verify API key: `cat ml/analysis/.env`
- Check filters aren't too restrictive
- Try without filters first

## Next Steps

1. **Build FastAPI Service**: Create `api.py` for HTTP endpoint
2. **Add Caching**: Cache generated questions to reduce API calls
3. **Implement Feedback Loop**: Use user ratings to improve retrieval
4. **Add More Rerankers**: Implement multiple reranking strategies
5. **Fine-tune Embeddings**: Train custom embeddings on quiz data

## License

Part of PrepArc platform.
