"""
Quick verification script for RAG Quiz Generator
Tests all major functionality after vector store is built
"""
import sys
from pathlib import Path

def verify_installation():
    """Verify all components are installed"""
    print("🔍 Verifying RAG Quiz Generator Installation...\n")
    
    errors = []
    
    # Check Python version
    print("1. Checking Python version...")
    if sys.version_info < (3, 12):
        errors.append(f"Python 3.12+ required, found {sys.version}")
    else:
        print(f"   ✅ Python {sys.version_info.major}.{sys.version_info.minor}")
    
    # Check dependencies
    print("\n2. Checking dependencies...")
    required_packages = [
        ('langchain', 'langchain'),
        ('langchain_google_genai', 'langchain_google_genai'),
        ('chromadb', 'chromadb'),
        ('sentence_transformers', 'sentence_transformers'),
        ('fastapi', 'fastapi'),
        ('uvicorn', 'uvicorn'),
        ('pydantic', 'pydantic'),
        ('python-dotenv', 'dotenv')  # Package name vs import name
    ]
    
    missing = []
    for package_name, import_name in required_packages:
        try:
            __import__(import_name)
            print(f"   ✅ {package_name}")
        except ImportError:
            missing.append(package_name)
            print(f"   ❌ {package_name} (missing)")
    
    if missing:
        errors.append(f"Missing packages: {', '.join(missing)}")
    
    # Check data files
    print("\n3. Checking data files...")
    data_dir = Path(__file__).parent.parent.parent / "data"
    json_files = list(data_dir.glob("*.json"))
    
    if not json_files:
        errors.append("No JSON data files found in data/")
        print(f"   ❌ No files in {data_dir}")
    else:
        print(f"   ✅ Found {len(json_files)} JSON files:")
        for f in json_files:
            print(f"      - {f.name}")
    
    # Check .env file
    print("\n4. Checking environment configuration...")
    env_file = Path(__file__).parent.parent / "analysis" / ".env"
    
    if not env_file.exists():
        errors.append(".env file not found in ml/analysis/")
        print(f"   ❌ {env_file} not found")
    else:
        print(f"   ✅ .env file exists")
        
        # Check for API key
        with open(env_file) as f:
            content = f.read()
            if 'GEMINI_API_KEY' in content:
                print("   ✅ GEMINI_API_KEY found")
            else:
                errors.append("GEMINI_API_KEY not found in .env")
                print("   ❌ GEMINI_API_KEY not found")
    
    # Check vector store
    print("\n5. Checking vector store...")
    chroma_db = Path(__file__).parent / "chroma_db"
    
    if not chroma_db.exists():
        print("   ⚠️  Vector store not built yet")
        print("      Run: python rag_quiz_generator.py --rebuild")
    else:
        print("   ✅ Vector store exists")
        
        # Check if it has data
        sqlite_file = chroma_db / "chroma.sqlite3"
        if sqlite_file.exists():
            size_mb = sqlite_file.stat().st_size / (1024 * 1024)
            print(f"      Database size: {size_mb:.2f} MB")
        
    # Summary
    print("\n" + "="*60)
    if errors:
        print("❌ VERIFICATION FAILED")
        print("\nErrors found:")
        for i, error in enumerate(errors, 1):
            print(f"  {i}. {error}")
        return False
    else:
        print("✅ VERIFICATION PASSED")
        print("\nAll components are properly installed!")
        return True

def test_basic_functionality():
    """Test basic RAG functionality"""
    print("\n\n🧪 Testing Basic Functionality...\n")
    
    try:
        from rag_quiz_generator import RAGQuizGenerator
        
        # Initialize
        print("1. Initializing RAG generator...")
        generator = RAGQuizGenerator()
        print("   ✅ Initialized")
        
        # Check vector store
        print("\n2. Checking vector store...")
        chroma_db = Path(__file__).parent / "chroma_db"
        
        if not chroma_db.exists():
            print("   ⚠️  Vector store not built")
            print("   Run: python rag_quiz_generator.py --rebuild")
            return False
        
        generator.build_vector_store(force_rebuild=False)
        print("   ✅ Vector store loaded")
        
        # Test retrieval
        print("\n3. Testing retrieval...")
        docs = generator.retrieve_similar_questions(topic="Arrays", k=5)
        print(f"   ✅ Retrieved {len(docs)} documents")
        
        if docs:
            print(f"\n   Sample document:")
            print(f"   Topic: {docs[0].metadata.get('topic')}")
            print(f"   Subject: {docs[0].metadata.get('subject')}")
            print(f"   Difficulty: {docs[0].metadata.get('difficulty')}")
        
        # Test pattern extraction
        print("\n4. Testing pattern extraction...")
        patterns = generator.extract_patterns(docs)
        print(f"   ✅ Patterns extracted:")
        print(f"      - Avg options: {patterns['avg_options']:.1f}")
        print(f"      - Avg length: {patterns['avg_question_length']:.0f} chars")
        print(f"      - Examples: {patterns['num_examples']}")
        
        print("\n✅ BASIC TESTS PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_generation():
    """Test question generation (if vector store exists)"""
    print("\n\n🎯 Testing Question Generation...\n")
    
    chroma_db = Path(__file__).parent / "chroma_db"
    if not chroma_db.exists():
        print("⚠️  Skipping generation test (vector store not built)")
        print("   Build vector store first: python rag_quiz_generator.py --rebuild")
        return None
    
    try:
        from rag_quiz_generator import RAGQuizGenerator
        
        print("1. Initializing generator...")
        generator = RAGQuizGenerator()
        generator.build_vector_store()
        
        print("\n2. Generating 2 test questions...")
        print("   (This may take 5-10 seconds)")
        
        questions = generator.generate_questions(
            topic="Arrays",
            difficulty="medium",
            count=2
        )
        
        if not questions:
            print("   ❌ No questions generated")
            return False
        
        print(f"\n   ✅ Generated {len(questions)} questions")
        
        # Display first question
        print("\n   Sample Question:")
        q = questions[0]
        print(f"   Q: {q['question'][:100]}...")
        print(f"   Options: {len(q['options'])}")
        print(f"   Correct: {q['correct_option_index']}")
        print(f"   Topic: {q.get('topic')}")
        print(f"   Difficulty: {q.get('difficulty')}")
        
        print("\n✅ GENERATION TEST PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ GENERATION TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all verification tests"""
    print("="*60)
    print(" RAG Quiz Generator - Verification Suite")
    print("="*60)
    
    # Step 1: Verify installation
    install_ok = verify_installation()
    
    if not install_ok:
        print("\n⚠️  Please fix installation issues before proceeding")
        return
    
    # Step 2: Test basic functionality
    basic_ok = test_basic_functionality()
    
    if not basic_ok:
        return
    
    # Step 3: Test generation (optional)
    gen_ok = test_generation()
    
    # Final summary
    print("\n" + "="*60)
    print(" VERIFICATION COMPLETE")
    print("="*60)
    
    if install_ok and basic_ok:
        print("\n✅ System is ready to use!")
        print("\nNext steps:")
        print("  1. Generate quiz: python rag_quiz_generator.py --topic 'Arrays' --count 5")
        print("  2. Start API: python api.py --port 8001")
        print("  3. See README.md for more examples")
    
    if gen_ok is None:
        print("\n⚠️  Vector store not built yet")
        print("   Run: python rag_quiz_generator.py --rebuild")

if __name__ == "__main__":
    main()
