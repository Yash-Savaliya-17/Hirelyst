#!/usr/bin/env node
// RAG-powered quiz generation using Google Gemini
// Usage: node scripts/generate_quiz_rag.js --subject "C Programming Mock Tests" --topic Arrays --difficulty medium --count 5

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'ml', 'analysis', '.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');

let natural = null;
try { natural = require('natural'); } catch(e) {}

const DATA_DIR = path.join(__dirname, '..', 'data');

function loadAllQuestions() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  const all = [];
  for (const f of files) {
    const p = path.join(DATA_DIR, f);
    try {
      const txt = fs.readFileSync(p, 'utf8');
      const arr = JSON.parse(txt);
      for (const q of arr) {
        q.__source_file = f;
        all.push(q);
      }
    } catch (err) {
      console.error('Failed to read', p, err.message);
    }
  }
  return all;
}

// Simple BM25-like scoring using TF-IDF
function buildSearchIndex(docs) {
  if (!natural) {
    // Simple keyword matching fallback
    return {
      search: (query, topK) => {
        const queryTerms = query.toLowerCase().split(/\s+/);
        const scored = docs.map((doc, idx) => {
          const text = `${doc.subject||''} ${doc.topic||''} ${doc.question||''} ${(doc.options||[]).join(' ')}`.toLowerCase();
          let score = 0;
          queryTerms.forEach(term => {
            if (text.includes(term)) score++;
          });
          return { idx, score };
        });
        return scored.filter(s => s.score > 0).sort((a,b) => b.score - a.score).slice(0, topK);
      }
    };
  }
  
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();
  docs.forEach(d => {
    tfidf.addDocument(`${d.subject||''} ${d.topic||''} ${d.question||''} ${(d.options||[]).join(' ')}`);
  });
  
  return {
    search: (query, topK) => {
      const scores = [];
      tfidf.tfidfs(query, (i, measure) => {
        scores.push({ idx: i, score: measure });
      });
      return scores.filter(s => s.score > 0).sort((a,b) => b.score - a.score).slice(0, topK);
    }
  };
}

// Get embeddings using Gemini
async function getEmbedding(genAI, text) {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    // console.error('Embedding error:', error.message);
    return null;
  }
}

function cosine(a, b) {
  if (!a || !b) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

async function semanticSearch(genAI, query, docs, embeddings, topK = 20) {
  if (!embeddings || embeddings.length === 0) return [];
  
  const queryEmb = await getEmbedding(genAI, query);
  if (!queryEmb) return [];
  
  const scores = embeddings.map((emb, idx) => ({
    idx,
    score: cosine(queryEmb, emb)
  }));
  
  return scores.sort((a, b) => b.score - a.score).slice(0, topK);
}

function mergeDedupe(sem, sparse, keep = 30) {
  const seen = new Map();
  const merged = [];
  
  for (const list of [sem, sparse]) {
    for (const it of list) {
      if (!seen.has(it.idx)) {
        seen.set(it.idx, true);
        merged.push(it);
      }
      if (merged.length >= keep) break;
    }
  }
  
  return merged.slice(0, keep);
}

function extractPatternsFromExamples(examples) {
  const patt = { 
    avgOptions: 0, 
    optionCounts: {}, 
    avgQlen: 0, 
    difficultyDist: {},
    topics: {}
  };
  
  if (!examples.length) return patt;
  
  let qlen = 0;
  for (const ex of examples) {
    const oc = (ex.options && ex.options.length) || 0;
    patt.avgOptions += oc;
    patt.optionCounts[oc] = (patt.optionCounts[oc] || 0) + 1;
    qlen += (ex.question || '').length;
    patt.difficultyDist[ex.difficulty || 'unknown'] = (patt.difficultyDist[ex.difficulty || 'unknown'] || 0) + 1;
    if (ex.topic) patt.topics[ex.topic] = (patt.topics[ex.topic] || 0) + 1;
  }
  
  patt.avgOptions = +(patt.avgOptions / examples.length).toFixed(1);
  patt.avgQlen = Math.round(qlen / examples.length);
  
  return patt;
}

async function generateQuestionsWithGemini(genAI, reqSpec, patterns, examples, count = 5) {
  // Try multiple model names
  const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.5-flash-latest"];
  let model = null;
  
  for (const modelName of modelNames) {
    try {
      model = genAI.getGenerativeModel({ model: modelName });
      break;
    } catch (e) {
      continue;
    }
  }
  
  if (!model) {
    console.error('Could not initialize any Gemini model');
    throw new Error('No valid Gemini model found');
  }
  
  const exampleText = examples.slice(0, 5).map((e, i) => 
    `Example ${i + 1}:
Question: ${e.question}
Options: ${(e.options || []).join(' | ')}
Correct Answer Index: ${e.correct_option_index}
Explanation: ${e.explanation || 'N/A'}
Difficulty: ${e.difficulty}
---`
  ).join('\n\n');
  
  const prompt = `You are an expert quiz question generator. Generate ${count} multiple-choice questions (MCQs) based on the following specifications:

**Requirements:**
- Subject: ${reqSpec.subject || 'General'}
- Topic: ${reqSpec.topic || 'General'}
- Subtopic: ${reqSpec.subtopic || 'N/A'}
- Difficulty: ${reqSpec.difficulty || 'medium'}

**Style Guidelines from Examples:**
- Average options per question: ${patterns.avgOptions}
- Average question length: ${patterns.avgQlen} characters
- Difficulty distribution: ${JSON.stringify(patterns.difficultyDist)}

**Example Questions (for style reference only - DO NOT copy):**
${exampleText}

**Important Instructions:**
1. Generate EXACTLY ${count} original questions
2. Each question must have ${Math.round(patterns.avgOptions) || 3} options
3. Include correct_option_index (0-based index of correct answer)
4. Provide a brief explanation for each question
5. Match the difficulty level: ${reqSpec.difficulty}
6. DO NOT copy examples verbatim - create new, original questions
7. Ensure questions are factually accurate and unambiguous
8. Questions should test understanding, not just memorization

**Output Format (STRICT JSON ONLY):**
Return a JSON array with this exact structure:
[
  {
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C"],
    "correct_option_index": 0,
    "explanation": "Brief explanation why the answer is correct",
    "difficulty": "${reqSpec.difficulty}",
    "tags": ["${reqSpec.subject}", "${reqSpec.topic}"]
  }
]

Generate the questions now:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (jsonMatch) {
      text = jsonMatch[1];
    }
    
    // Try to parse JSON
    const questions = JSON.parse(text);
    
    if (Array.isArray(questions) && questions.length > 0) {
      return questions;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Generation error:', error.message);
    
    // Fallback: create template questions from examples
    return examples.slice(0, count).map((ex, i) => ({
      question: ex.question || `Question about ${reqSpec.topic}`,
      options: ex.options || ['A', 'B', 'C'],
      correct_option_index: ex.correct_option_index || 0,
      explanation: ex.explanation || 'No explanation available',
      difficulty: reqSpec.difficulty || 'medium',
      tags: [reqSpec.subject, reqSpec.topic].filter(Boolean)
    }));
  }
}

async function main() {
  const argv = require('minimist')(process.argv.slice(2));
  const subject = argv.subject || argv.s || null;
  const topic = argv.topic || argv.t || null;
  const subtopic = argv.subtopic || argv.sub || null;
  const difficulty = argv.difficulty || argv.d || 'medium';
  const count = parseInt(argv.count || argv.n || 5, 10);
  const useEmbeddings = argv.embeddings === true; // Default false (quota limits)

  console.log('🚀 RAG Quiz Generator (Gemini-powered)\n');
  
  // Initialize Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in ml/analysis/.env');
    process.exit(1);
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  console.log('✓ Gemini API initialized\n');

  // Load questions
  console.log('📚 Loading question database from', DATA_DIR);
  const all = loadAllQuestions();
  if (!all.length) {
    console.error('❌ No questions found in data folder');
    process.exit(1);
  }
  console.log(`✓ Loaded ${all.length} questions\n`);

  // Filter by subject/topic/subtopic
  const filtered = all.filter(q => {
    if (subject && (q.subject || '').toLowerCase() !== subject.toLowerCase()) return false;
    if (topic && (q.topic || '').toLowerCase() !== topic.toLowerCase()) return false;
    if (subtopic && (q.subtopic || '').toLowerCase() !== (subtopic || '').toLowerCase()) return false;
    return true;
  });
  
  const pool = filtered.length ? filtered : all;
  console.log(`🎯 Using ${pool.length} examples for retrieval\n`);

  const reqSpec = { subject, topic, subtopic, difficulty, count };
  const query = `${subject || ''} ${topic || ''} ${subtopic || ''} difficulty:${difficulty}`.trim();

  // Build search index
  console.log('🔍 Building search index...');
  const searchIndex = buildSearchIndex(pool);
  const sparseResults = searchIndex.search(query, 30);
  console.log(`✓ Found ${sparseResults.length} candidates via keyword search\n`);

  let finalResults = sparseResults;
  
  // Semantic search with embeddings (optional, can be slow)
  if (useEmbeddings && pool.length <= 100) {
    console.log('🧠 Computing embeddings for semantic search...');
    const embeddings = [];
    for (let i = 0; i < Math.min(pool.length, 100); i++) {
      const text = `${pool[i].subject||''} ${pool[i].topic||''} ${pool[i].question||''}`;
      const emb = await getEmbedding(genAI, text);
      embeddings.push(emb);
      if ((i + 1) % 10 === 0) {
        console.log(`  Processed ${i + 1}/${Math.min(pool.length, 100)} embeddings`);
      }
    }
    
    console.log('🔎 Performing semantic search...');
    const semResults = await semanticSearch(genAI, query, pool, embeddings, 20);
    console.log(`✓ Found ${semResults.length} candidates via semantic search\n`);
    
    // Merge and dedupe
    finalResults = mergeDedupe(semResults, sparseResults, 30);
  }

  // Get top examples
  const topExamples = finalResults.slice(0, 8).map(r => pool[r.idx]);
  console.log(`📊 Selected ${topExamples.length} top examples for pattern extraction\n`);

  // Extract patterns
  const patterns = extractPatternsFromExamples(topExamples);
  console.log('📈 Patterns extracted:');
  console.log(`  - Average options: ${patterns.avgOptions}`);
  console.log(`  - Average question length: ${patterns.avgQlen} chars`);
  console.log(`  - Difficulty distribution:`, patterns.difficultyDist);
  console.log();

  // Generate questions
  console.log(`✨ Generating ${count} questions with Gemini...\n`);
  const generated = await generateQuestionsWithGemini(genAI, reqSpec, patterns, topExamples, count);

  // Format output
  const final = generated.map((q, i) => ({
    id: `gen_${Date.now()}_${i}`,
    question: q.question,
    options: q.options,
    correct_option_index: q.correct_option_index,
    explanation: q.explanation,
    difficulty: q.difficulty || difficulty,
    tags: q.tags || [subject, topic, subtopic].filter(Boolean)
  }));

  console.log('✅ Generation complete!\n');
  console.log('═'.repeat(80));
  console.log(JSON.stringify({
    request: reqSpec,
    patterns,
    retrieved_examples_count: topExamples.length,
    output: final
  }, null, 2));
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
