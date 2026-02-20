"""
RAG Quiz Generator for MCQ questions
"""
import os
import shutil
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.embeddings.base import Embeddings
from sentence_transformers import SentenceTransformer
import json
from pathlib import Path
from typing import List


class SentenceTransformerEmbeddings(Embeddings):
    """Custom embeddings using Sentence Transformers"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of documents"""
        embeddings = self.model.encode(texts, convert_to_tensor=False)
        return embeddings.tolist()
    
    def embed_query(self, text: str) -> List[float]:
        """Embed a single query"""
        embedding = self.model.encode([text], convert_to_tensor=False)
        return embedding[0].tolist()


class RAGQuizGenerator:
    def __init__(self, data_dir: str, collection_name: str = "mcq_questions", persist_directory: str = "./chroma_db"):
        """
        Initialize RAG Quiz Generator
        
        Args:
            data_dir: Directory containing MCQ JSON files
            collection_name: Name for ChromaDB collection
            persist_directory: Directory for ChromaDB persistence
        """
        self.data_dir = Path(data_dir)
        self.collection_name = collection_name
        
        # Initialize Sentence Transformer embeddings (free, local)
        print("🔄 Loading Sentence Transformer model...")
        embedding_model = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        self.embeddings = SentenceTransformerEmbeddings(model_name=embedding_model)
        print(f"✅ Loaded embedding model: {embedding_model}")
        
        # Initialize vector store
        self.persist_directory = persist_directory
        self.vectorstore = None
        self.retriever = None
        self.all_questions = []

    def _has_persisted_data(self) -> bool:
        persist_path = Path(self.persist_directory)
        return persist_path.exists() and any(persist_path.rglob("*"))

    def _load_existing_vector_store(self) -> bool:
        try:
            self.vectorstore = Chroma(
                collection_name=self.collection_name,
                embedding_function=self.embeddings,
                persist_directory=self.persist_directory
            )
            self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 5})
            count = self.vectorstore._collection.count()
            if count > 0:
                print(f"✅ Loaded existing MCQ vector store with {count} entries")
                return True
            return False
        except Exception as e:
            print(f"⚠️ Could not load existing MCQ vector store: {e}")
            self.vectorstore = None
            self.retriever = None
            return False
        
    def load_and_index_data(self):
        """Load MCQ data from JSON files and create vector store"""
        documents = []
        self.all_questions = []
        
        # Load all JSON files from data directory
        for json_file in self.data_dir.glob("*.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    # Handle both array and object structures
                    questions = data if isinstance(data, list) else data.get('questions', [])
                    self.all_questions.extend(questions)
                    
                    for item in questions:
                        # Create document text from question
                        doc_text = f"Question: {item.get('question', '')}\n"
                        doc_text += f"Subject: {item.get('subject', '')}\n"
                        doc_text += f"Topic: {item.get('topic', '')}\n"
                        doc_text += f"Difficulty: {item.get('difficulty', '')}\n"
                        doc_text += f"Options: {json.dumps(item.get('options', []))}\n"
                        doc_text += f"Answer: {item.get('correct_answer', '')}\n"
                        
                        documents.append(doc_text)
            except Exception as e:
                print(f"Error loading {json_file}: {e}")
        
        if not documents:
            print("No documents loaded!")
            return
        
        # Split documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        splits = text_splitter.create_documents(documents)
        
        # Create vector store
        self.vectorstore = Chroma.from_documents(
            documents=splits,
            embedding=self.embeddings,
            collection_name=self.collection_name,
            persist_directory=self.persist_directory
        )
        
        self.retriever = self.vectorstore.as_retriever(
            search_kwargs={"k": 5}
        )
        
        print(f"Indexed {len(documents)} MCQ questions")
    
    def retrieve_context(self, subject: str, topic: str = None, difficulty: str = None, k: int = 5):
        """
        Retrieve relevant MCQ context
        
        Args:
            subject: Subject name
            topic: Optional topic filter
            difficulty: Optional difficulty filter
            k: Number of results to retrieve
            
        Returns:
            List of relevant question contexts
        """
        if not self.retriever:
            self.load_and_index_data()
        
        # Build query
        query = f"Subject: {subject}"
        if topic:
            query += f" Topic: {topic}"
        if difficulty:
            query += f" Difficulty: {difficulty}"
        
        # Retrieve documents
        docs = self.retriever.get_relevant_documents(query)
        
        return [doc.page_content for doc in docs[:k]]
    
    def build_vector_store(self, force_rebuild: bool = False):
        """Build or load vector store"""
        if not force_rebuild and self.vectorstore:
            print("Vector store already initialized")
            return

        if force_rebuild:
            persist_path = Path(self.persist_directory)
            if persist_path.exists():
                shutil.rmtree(persist_path, ignore_errors=True)

        if not force_rebuild and self._has_persisted_data() and self._load_existing_vector_store():
            return
        
        self.load_and_index_data()
        print(f"✅ Vector store built with {len(self.all_questions)} questions")
    
    def retrieve_similar_questions(self, subject: str = None, topic: str = None, difficulty: str = None, k: int = 5):
        """Retrieve similar questions (alias for retrieve_context)"""
        return self.retriever.get_relevant_documents(
            f"Subject: {subject or ''} Topic: {topic or ''} Difficulty: {difficulty or ''}"
        ) if self.retriever else []
    
    def get_stats(self):
        """Get statistics about indexed data"""
        if not self.vectorstore:
            return {"status": "not_initialized", "count": 0}
        
        try:
            collection = self.vectorstore._collection
            count = collection.count()
            return {
                "status": "initialized",
                "count": count,
                "collection_name": self.collection_name
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
