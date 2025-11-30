# RAG Quiz Generator (Gemini-powered)

## Quick Start

### 1. Install dependencies:

```powershell
cd d:\test\prepArc1
npm install @google/generative-ai dotenv natural minimist
```

### 2. Configure API Key

The script automatically loads `GEMINI_API_KEY` from `ml/analysis/.env`:
```
GEMINI_API_KEY=AIzaSyCj7zcetnituS3YwDsGhi2H0xNv5TVk1v0
```

### 3. Run the generator:

```powershell
# Basic usage
node scripts\generate_quiz_rag.js --subject "C Programming Mock Tests" --topic "Arrays" --difficulty medium --count 5

# Without embeddings (faster, keyword-only)
node scripts\generate_quiz_rag.js --subject "Data Structures Mock Tests" --topic "Stack" --count 3 --embeddings false
```

## What This Script Does

### 1. **Input Parsing**
- Parses subject, topic, subtopic, difficulty level from CLI args
- Loads all questions from `data/*.json` files
- Filters question pool based on input criteria

### 2. **Hybrid Retrieval (Fast)**
- **Sparse Search**: TF-IDF based keyword matching (< 50ms)
- **Semantic Search**: Gemini embeddings with cosine similarity (optional, ~2-5s for 100 docs)
- Merges and deduplicates top 30 candidates

### 3. **Reranking**
- Uses embedding similarity scores to rerank candidates
- Selects top 8 most relevant examples

### 4. **Pattern Extraction**
- Analyzes retrieved examples for:
  - Average number of options per question
  - Question length distribution
  - Difficulty levels
  - Common topics and styles

### 5. **Context Compression**
- Summarizes patterns into compact format
- Includes 5 example questions for style reference

### 6. **Question Generation (Gemini)**
- Uses `gemini-1.5-pro` model for generation
- Provides detailed prompt with:
  - Requirements (subject, topic, difficulty)
  - Style guidelines from patterns
  - Example questions (with instruction NOT to copy)
  - Strict JSON output format
- Parses and validates generated JSON

### 7. **Quality Filtering**
- Validates JSON structure
- Ensures all required fields present
- Fallback to template-based generation if API fails

## Output Format

```json
{
  "request": {
    "subject": "C Programming Mock Tests",
    "topic": "Arrays",
    "difficulty": "medium",
    "count": 5
  },
  "patterns": {
    "avgOptions": 3,
    "avgQlen": 250,
    "difficultyDist": { "medium": 8 }
  },
  "retrieved_examples_count": 8,
  "output": [
    {
      "id": "gen_1234567890_0",
      "question": "What is the time complexity...",
      "options": ["O(1)", "O(n)", "O(log n)"],
      "correct_option_index": 1,
      "explanation": "Because...",
      "difficulty": "medium",
      "tags": ["C Programming Mock Tests", "Arrays"]
    }
  ]
}
```

## Performance Notes

### Current Performance
- **Keyword search only**: ~50-100ms (for pools < 1000 questions)
- **With embeddings**: ~2-5 seconds (for 100 documents)
- **Generation**: ~3-5 seconds (Gemini API call)

### Production Recommendations

For **low-latency (<100ms) retrieval** at scale:

1. **Pre-compute and persist embeddings**:
   ```javascript
   // One-time indexing
   - Compute embeddings for all questions
   - Store in vector DB (Pinecone, Weaviate, Milvus, ChromaDB)
   ```

2. **Use approximate nearest neighbor (ANN)**:
   - HNSW index for sub-100ms retrieval
   - FAISS for CPU-based similarity search

3. **Hybrid approach**:
   - Keep keyword search for fast filtering
   - Use vector DB for semantic reranking
   - Cache frequent queries

4. **Optimize generation**:
   - Use `gemini-1.5-flash-8b` for faster responses
   - Batch multiple requests
   - Cache generated questions by topic/difficulty

## Advanced Usage

### Customize embedding behavior
```powershell
# Skip embeddings for speed
node scripts\generate_quiz_rag.js --topic "Queue" --embeddings false

# Use embeddings for better quality
node scripts\generate_quiz_rag.js --topic "Binary Trees" --embeddings true
```

### Integration with Backend
```javascript
const { execSync } = require('child_process');

const result = execSync(
  `node scripts/generate_quiz_rag.js --subject "DSA" --topic "Graphs" --count 10`,
  { encoding: 'utf8' }
);

const data = JSON.parse(result);
console.log(data.output); // Generated questions
```

## Next Steps

- [ ] Add vector DB persistence (Pinecone/Weaviate integration)
- [ ] Implement cross-encoder reranking for better relevance
- [ ] Add question uniqueness checks (prevent duplicates)
- [ ] Implement answer validation logic
- [ ] Add support for multiple difficulty levels in one request
- [ ] Cache embeddings to disk for faster subsequent runs
