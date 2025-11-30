"""
Test script for RAG Quiz Generator
Run with: python test_rag.py
"""

import json
from rag_quiz_generator import RAGQuizGenerator

def print_separator():
    print("\n" + "="*80 + "\n")

def test_basic_generation():
    """Test basic quiz generation"""
    print("🧪 TEST 1: Basic Quiz Generation")
    print_separator()
    
    generator = RAGQuizGenerator()
    generator.build_vector_store()
    
    questions = generator.generate_questions(
        topic="Arrays",
        difficulty="medium",
        count=3
    )
    
    print(f"✅ Generated {len(questions)} questions")
    for i, q in enumerate(questions, 1):
        print(f"\nQuestion {i}:")
        print(f"  Q: {q.get('question', 'N/A')[:100]}...")
        print(f"  Options: {len(q.get('options', []))}")
        print(f"  Correct: {q.get('correct_option_index', 'N/A')}")
    
    return questions

def test_with_filters():
    """Test with subject and topic filters"""
    print("🧪 TEST 2: Quiz Generation with Filters")
    print_separator()
    
    generator = RAGQuizGenerator()
    generator.build_vector_store()
    
    questions = generator.generate_questions(
        subject="C Programming Mock Tests",
        topic="Stack",
        difficulty="easy",
        count=2
    )
    
    print(f"✅ Generated {len(questions)} questions")
    for q in questions:
        print(f"\n📝 {q.get('question', 'N/A')[:150]}")
        print(f"   Subject: {q.get('subject', 'N/A')}")
        print(f"   Topic: {q.get('topic', 'N/A')}")
        print(f"   Difficulty: {q.get('difficulty', 'N/A')}")
    
    return questions

def test_retrieval_only():
    """Test retrieval without generation"""
    print("🧪 TEST 3: Retrieval Only (No Generation)")
    print_separator()
    
    generator = RAGQuizGenerator()
    generator.build_vector_store()
    
    docs = generator.retrieve_similar_questions(
        topic="Binary Trees",
        difficulty="medium",
        k=5
    )
    
    print(f"✅ Retrieved {len(docs)} similar documents")
    for i, doc in enumerate(docs, 1):
        print(f"\n📄 Document {i}:")
        print(f"   Topic: {doc.metadata.get('topic', 'N/A')}")
        print(f"   Difficulty: {doc.metadata.get('difficulty', 'N/A')}")
        print(f"   Content: {doc.page_content[:200]}...")
    
    return docs

def test_pattern_extraction():
    """Test pattern extraction"""
    print("🧪 TEST 4: Pattern Extraction")
    print_separator()
    
    generator = RAGQuizGenerator()
    generator.build_vector_store()
    
    docs = generator.retrieve_similar_questions(topic="Queue", k=15)
    patterns = generator.extract_patterns(docs)
    
    print("✅ Patterns extracted:")
    print(json.dumps(patterns, indent=2))
    
    return patterns

def test_compression():
    """Test with contextual compression"""
    print("🧪 TEST 5: Quiz Generation with Compression")
    print_separator()
    
    generator = RAGQuizGenerator()
    generator.build_vector_store()
    
    questions = generator.generate_questions(
        topic="Sorting",
        count=3,
        use_compression=True
    )
    
    print(f"✅ Generated {len(questions)} questions with compression")
    for q in questions:
        print(f"\n📝 {q.get('question', 'N/A')[:100]}...")
    
    return questions

def test_save_load():
    """Test saving and loading questions"""
    print("🧪 TEST 6: Save and Load Questions")
    print_separator()
    
    generator = RAGQuizGenerator()
    generator.build_vector_store()
    
    questions = generator.generate_questions(topic="Linked List", count=3)
    
    output_file = "test_output.json"
    generator.save_questions(questions, output_file)
    
    with open(output_file, 'r') as f:
        loaded = json.load(f)
    
    print(f"✅ Saved {len(questions)} questions")
    print(f"✅ Loaded {len(loaded)} questions")
    print(f"✅ Match: {len(questions) == len(loaded)}")
    
    return questions, loaded

def run_all_tests():
    """Run all tests"""
    print("🚀 RAG Quiz Generator - Test Suite")
    print("="*80)
    
    try:
        test_basic_generation()
        print_separator()
        
        test_with_filters()
        print_separator()
        
        test_retrieval_only()
        print_separator()
        
        test_pattern_extraction()
        print_separator()
        
        # Skip compression test if you want to save time
        # test_compression()
        # print_separator()
        
        test_save_load()
        print_separator()
        
        print("✅ ALL TESTS PASSED!")
        
    except Exception as e:
        print(f"❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_all_tests()
