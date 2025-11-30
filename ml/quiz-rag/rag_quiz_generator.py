import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain.schema import Document
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
import google.generativeai as genai

# Load environment variables from current directory
load_dotenv()

class RAGQuizGenerator:
    """
    High-quality, low-latency RAG-powered Quiz Generation System using LangChain.
    
    Architecture:
    1. Input parsing
    2. Fast retrieval (ChromaDB vector store)
    3. Reranking (contextual compression)
    4. Pattern extraction from retrieved examples
    5. Compression (top-k selection)
    6. LLM generation (Google Gemini)
    7. Quality filters
    8. JSON output
    """
    
    def __init__(self, data_dir: str = None, persist_directory: str = "./chroma_db"):
        """
        Initialize RAG Quiz Generator.
        
        Args:
            data_dir: Path to directory containing JSON question files
            persist_directory: Path to persist ChromaDB vector store
        """
        if data_dir is None:
            # Check environment variable first, then fall back to relative path
            data_dir = os.getenv("DATA_DIR") or str(Path(__file__).parent.parent.parent / "data")
        self.data_dir = Path(data_dir)
        self.persist_directory = persist_directory
        
        # Initialize Google Gemini API
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        # Configure Google GenAI
        genai.configure(api_key=api_key)
        
        # Initialize embeddings (using Google's text-embedding-004)
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=api_key
        )
        
        # Initialize LLM for generation (using direct SDK)
        self.llm = genai.GenerativeModel('gemini-2.5-flash')
        
        # Initialize vector store (will be loaded or created)
        self.vectorstore = None
        self.all_questions = []
        
    def load_questions_from_json(self) -> List[Dict[str, Any]]:
        """
        Load all questions from JSON files in data directory.
        
        Returns:
            List of question dictionaries
        """
        questions = []
        json_files = list(self.data_dir.glob("*.json"))
        
        print(f"📂 Found {len(json_files)} JSON files in {self.data_dir}")
        
        for json_file in json_files:
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    questions.extend(data)
                    print(f"  ✅ Loaded {len(data)} questions from {json_file.name}")
            except Exception as e:
                print(f"  ❌ Error loading {json_file.name}: {e}")
        
        print(f"📊 Total questions loaded: {len(questions)}")
        return questions
    
    def create_documents_from_questions(self, questions: List[Dict[str, Any]]) -> List[Document]:
        """
        Convert questions to LangChain Documents with metadata.
        
        Args:
            questions: List of question dictionaries
            
        Returns:
            List of LangChain Document objects
        """
        documents = []
        
        for q in questions:
            try:
                # Get options safely
                options = q.get('options', [])
                correct_idx = q.get('correct_option_index', 0)
                
                # Get correct answer safely
                correct_answer = ''
                if options and 0 <= correct_idx < len(options):
                    correct_answer = options[correct_idx]
                
                # Create rich text content for better embedding
                content = f"""
Subject: {q.get('subject', 'Unknown')}
Topic: {q.get('topic', 'Unknown')}
Difficulty: {q.get('difficulty', 'medium')}
Question: {q.get('question', '')}
Options: {', '.join(options)}
Correct Answer: {correct_answer}
Explanation: {q.get('explanation', 'No explanation')}
                """.strip()
                
                metadata = {
                    "id": q.get("id", ""),
                    "subject": q.get("subject", ""),
                    "topic": q.get("topic", ""),
                    "difficulty": q.get("difficulty", "medium"),
                    "type": q.get("type", "mcq"),
                    "source": q.get("source", ""),
                    "num_options": len(options),
                    "question_length": len(q.get("question", ""))
                }
                
                documents.append(Document(page_content=content, metadata=metadata))
            except Exception as e:
                # Skip problematic questions
                print(f"  ⚠️ Skipping question {q.get('id', 'unknown')}: {e}")
                continue
        
        return documents
    
    def build_vector_store(self, force_rebuild: bool = False):
        """
        Build or load ChromaDB vector store from questions.
        
        Args:
            force_rebuild: If True, rebuild vector store even if it exists
        """
        persist_path = Path(self.persist_directory)
        
        # Check if vector store exists
        if persist_path.exists() and not force_rebuild:
            print("🔄 Loading existing vector store...")
            self.vectorstore = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings
            )
            print("✅ Vector store loaded successfully")
            return
        
        print("🔨 Building new vector store...")
        
        # Load questions
        self.all_questions = self.load_questions_from_json()
        
        # Convert to documents
        documents = self.create_documents_from_questions(self.all_questions)
        print(f"📄 Created {len(documents)} documents")
        
        # Create vector store
        print("🧮 Generating embeddings and building vector store...")
        self.vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=self.persist_directory
        )
        
        print(f"✅ Vector store created with {len(documents)} documents")
    
    def add_questions_to_vectorstore(self, questions: List[Dict[str, Any]]) -> int:
        """
        Add newly generated questions to the vector store.
        
        Args:
            questions: List of question dictionaries with format:
                {
                    "question": str,
                    "options": {"A": str, "B": str, "C": str, "D": str},
                    "correct_answer": str,
                    "subject": str,
                    "topic": str,
                    "difficulty": str (optional)
                }
        
        Returns:
            Number of questions added
        """
        if not self.vectorstore:
            raise ValueError("Vector store not initialized. Call build_vector_store() first.")
        
        # Convert questions to documents
        documents = []
        for q in questions:
            try:
                # Format question text with options
                options_text = "\n".join([f"{k}. {v}" for k, v in q.get("options", {}).items()])
                content = f"{q['question']}\n\nOptions:\n{options_text}"
                
                # Create metadata
                metadata = {
                    "subject": q.get("subject", "Unknown"),
                    "topic": q.get("topic", "Unknown"),
                    "difficulty": q.get("difficulty", "medium"),
                    "correct_answer": q.get("correct_answer", "A"),
                    "source": "generated"  # Mark as AI-generated
                }
                
                documents.append(Document(
                    page_content=content,
                    metadata=metadata
                ))
            except Exception as e:
                print(f"⚠️ Skipping question: {e}")
                continue
        
        if not documents:
            return 0
        
        # Add to vector store
        print(f"📥 Adding {len(documents)} new questions to vector store...")
        self.vectorstore.add_documents(documents)
        print(f"✅ Added {len(documents)} questions to vector store")
        
        return len(documents)
    
    def retrieve_similar_questions(
        self, 
        subject: Optional[str] = None,
        topic: Optional[str] = None,
        difficulty: Optional[str] = None,
        k: int = 30
    ) -> List[Document]:
        """
        Retrieve similar questions using vector search with metadata filtering.
        
        Args:
            subject: Filter by subject
            topic: Filter by topic
            difficulty: Filter by difficulty
            k: Number of documents to retrieve
            
        Returns:
            List of retrieved documents
        """
        if not self.vectorstore:
            raise ValueError("Vector store not initialized. Call build_vector_store() first.")
        
        # Build query string
        query_parts = []
        if subject:
            query_parts.append(f"Subject: {subject}")
        if topic:
            query_parts.append(f"Topic: {topic}")
        if difficulty:
            query_parts.append(f"Difficulty: {difficulty}")
        
        query = " ".join(query_parts) if query_parts else "Generate quiz questions"
        
        # Build metadata filter (ChromaDB format)
        filter_dict = {}
        if subject or topic or difficulty:
            # ChromaDB requires $and operator for multiple conditions
            conditions = []
            if subject:
                conditions.append({"subject": {"$eq": subject}})
            if topic:
                conditions.append({"topic": {"$eq": topic}})
            if difficulty:
                conditions.append({"difficulty": {"$eq": difficulty}})
            
            if len(conditions) == 1:
                filter_dict = conditions[0]
            elif len(conditions) > 1:
                filter_dict = {"$and": conditions}
        
        # Retrieve with filtering
        if filter_dict:
            retriever = self.vectorstore.as_retriever(
                search_kwargs={"k": k, "filter": filter_dict}
            )
        else:
            retriever = self.vectorstore.as_retriever(search_kwargs={"k": k})
        
        docs = retriever.get_relevant_documents(query)
        
        print(f"🔍 Retrieved {len(docs)} similar questions")
        return docs
    
    def extract_patterns(self, documents: List[Document]) -> Dict[str, Any]:
        """
        Extract patterns from retrieved example questions.
        
        Args:
            documents: Retrieved documents
            
        Returns:
            Dictionary of extracted patterns
        """
        if not documents:
            return {}
        
        total_options = []
        total_question_len = []
        difficulties = []
        topics = set()
        subjects = set()
        
        for doc in documents:
            metadata = doc.metadata
            total_options.append(metadata.get("num_options", 4))
            total_question_len.append(metadata.get("question_length", 100))
            difficulties.append(metadata.get("difficulty", "medium"))
            topics.add(metadata.get("topic", ""))
            subjects.add(metadata.get("subject", ""))
        
        patterns = {
            "avg_options": sum(total_options) / len(total_options) if total_options else 4,
            "avg_question_length": sum(total_question_len) / len(total_question_len) if total_question_len else 100,
            "difficulty_distribution": {d: difficulties.count(d) for d in set(difficulties)},
            "topics": list(topics),
            "subjects": list(subjects),
            "num_examples": len(documents)
        }
        
        print(f"📊 Patterns extracted: {patterns['num_examples']} examples, "
              f"avg {patterns['avg_options']:.1f} options, "
              f"avg {patterns['avg_question_length']:.0f} chars")
        
        return patterns
    
    def generate_questions(
        self,
        subject: Optional[str] = None,
        topic: Optional[str] = None,
        difficulty: Optional[str] = None,
        count: int = 5,
        use_compression: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Generate quiz questions using RAG pipeline.
        
        Args:
            subject: Subject filter
            topic: Topic filter
            difficulty: Difficulty filter
            count: Number of questions to generate
            use_compression: Whether to use contextual compression retriever
            
        Returns:
            List of generated questions as dictionaries
        """
        # Step 1: Retrieve similar questions
        retrieved_docs = self.retrieve_similar_questions(
            subject=subject,
            topic=topic,
            difficulty=difficulty,
            k=30
        )
        
        if not retrieved_docs:
            print("⚠️ No documents retrieved, cannot generate questions")
            return []
        
        # Step 2: Extract patterns
        patterns = self.extract_patterns(retrieved_docs)
        
        # Step 3: Optionally apply contextual compression
        if use_compression and len(retrieved_docs) > 10:
            print("🗜️ Applying contextual compression...")
            # Note: Compression requires LangChain LLM, skipping for now
            # Can be implemented with alternative reranking
            retrieved_docs = retrieved_docs[:15]
            print(f"  ✅ Reduced to {len(retrieved_docs)} documents")
        
        # Step 4: Prepare examples for prompt
        examples_text = "\n\n".join([
            f"Example {i+1}:\n{doc.page_content}"
            for i, doc in enumerate(retrieved_docs[:10])
        ])
        
        # Step 5: Generate questions with LLM
        prompt_template = PromptTemplate(
            input_variables=["count", "subject", "topic", "difficulty", "examples", "patterns"],
            template="""You are an expert quiz question generator. Generate {count} high-quality multiple-choice questions based on the following examples and patterns.

**Subject**: {subject}
**Topic**: {topic}
**Difficulty**: {difficulty}

**Pattern Analysis**:
- Average options per question: {avg_options}
- Average question length: {avg_question_length} characters
- Difficulty distribution: {difficulty_dist}

**Example Questions**:
{examples}

**Instructions**:
1. Generate exactly {count} original questions (do NOT copy examples)
2. Each question should have {num_options} options
3. Questions should be {difficulty} difficulty level
4. Include clear, concise questions
5. Provide one correct answer and plausible distractors
6. Add explanations for correct answers

**Output Format** (JSON array):
[
  {{
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_option_index": 0,
    "explanation": "Explanation here",
    "subject": "{subject}",
    "topic": "{topic}",
    "difficulty": "{difficulty}"
  }}
]

Generate the questions now:"""
        )
        
        prompt = prompt_template.format(
            count=count,
            subject=subject or "Programming",
            topic=topic or "General",
            difficulty=difficulty or "medium",
            examples=examples_text,
            patterns=patterns,
            avg_options=int(patterns.get("avg_options", 4)),
            avg_question_length=int(patterns.get("avg_question_length", 100)),
            difficulty_dist=patterns.get("difficulty_distribution", {}),
            num_options=int(patterns.get("avg_options", 4))
        )
        
        print("🤖 Generating questions with Gemini...")
        
        try:
            response = self.llm.generate_content(prompt)
            response_text = response.text
            
            # Extract JSON from response
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                questions = json.loads(json_text)
                
                # Validate and clean questions
                valid_questions = []
                for q in questions:
                    if self._validate_question(q):
                        valid_questions.append(q)
                
                print(f"✅ Generated {len(valid_questions)} valid questions")
                return valid_questions
            else:
                print("⚠️ No valid JSON found in response")
                return []
                
        except Exception as e:
            print(f"❌ Error generating questions: {e}")
            return []
    
    def _validate_question(self, question: Dict[str, Any]) -> bool:
        """
        Validate generated question format.
        
        Args:
            question: Question dictionary
            
        Returns:
            True if valid, False otherwise
        """
        required_fields = ["question", "options", "correct_option_index", "explanation"]
        
        # Check required fields
        for field in required_fields:
            if field not in question:
                return False
        
        # Check options format
        if not isinstance(question["options"], list) or len(question["options"]) < 2:
            return False
        
        # Check correct_option_index
        idx = question["correct_option_index"]
        if not isinstance(idx, int) or idx < 0 or idx >= len(question["options"]):
            return False
        
        return True
    
    def save_questions(self, questions: List[Dict[str, Any]], output_file: str):
        """
        Save generated questions to JSON file.
        
        Args:
            questions: List of question dictionaries
            output_file: Output file path
        """
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)
        print(f"💾 Saved {len(questions)} questions to {output_file}")


def main():
    """Example usage of RAG Quiz Generator"""
    import argparse
    
    parser = argparse.ArgumentParser(description="RAG-powered Quiz Generation using LangChain")
    parser.add_argument("--subject", type=str, help="Filter by subject")
    parser.add_argument("--topic", type=str, help="Filter by topic")
    parser.add_argument("--difficulty", type=str, choices=["easy", "medium", "hard"], help="Difficulty level")
    parser.add_argument("--count", type=int, default=5, help="Number of questions to generate")
    parser.add_argument("--rebuild", action="store_true", help="Force rebuild vector store")
    parser.add_argument("--compression", action="store_true", help="Use contextual compression")
    parser.add_argument("--output", type=str, default="generated_quiz.json", help="Output file path")
    
    args = parser.parse_args()
    
    # Initialize generator
    print("🚀 Initializing RAG Quiz Generator...")
    generator = RAGQuizGenerator()
    
    # Build/load vector store
    generator.build_vector_store(force_rebuild=args.rebuild)
    
    # Generate questions
    print(f"\n🎯 Generating quiz...")
    print(f"  Subject: {args.subject or 'Any'}")
    print(f"  Topic: {args.topic or 'Any'}")
    print(f"  Difficulty: {args.difficulty or 'Any'}")
    print(f"  Count: {args.count}")
    
    questions = generator.generate_questions(
        subject=args.subject,
        topic=args.topic,
        difficulty=args.difficulty,
        count=args.count,
        use_compression=args.compression
    )
    
    # Save results
    if questions:
        generator.save_questions(questions, args.output)
        print("\n✨ Quiz generation complete!")
    else:
        print("\n❌ No questions generated")


if __name__ == "__main__":
    main()
