import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import google.generativeai as genai
import aiohttp

load_dotenv()

class DualRAGOrchestrator:
    """
    Orchestrator service that combines MCQ RAG and Theory RAG.
    
    Architecture:
    1. Receives quiz generation request
    2. Calls MCQ RAG service (parallel)
    3. Calls Theory RAG service (parallel)
    4. Combines both contexts
    5. Generates questions with Gemini
    6. Returns structured MCQs
    """
    
    def __init__(
        self,
        rag_service_url: str = "http://localhost:8001"
    ):
        """
        Initialize Dual RAG Orchestrator.
        
        Args:
            rag_service_url: URL of unified RAG service
        """
        self.rag_service_url = rag_service_url
        
        # Initialize Google Gemini API
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.llm = genai.GenerativeModel('gemini-2.5-flash')
    
    async def retrieve_mcq_examples(
        self,
        subject: Optional[str],
        topic: Optional[str],
        difficulty: Optional[str],
        k: int = 20
    ) -> Dict[str, Any]:
        """
        Retrieve similar MCQs from MCQ RAG service.
        
        Returns:
            Dict with MCQ examples
        """
        async with aiohttp.ClientSession() as session:
            try:
                payload = {
                    "subject": subject,
                    "topic": topic,
                    "difficulty": difficulty,
                    "k": k
                }
                
                async with session.post(
                    f"{self.mcq_rag_url}/retrieve-similar",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ Retrieved {data.get('count', 0)} MCQ examples")
                        return data
                    else:
                        print(f"⚠️ MCQ RAG returned status {response.status}")
                        return {"success": False, "documents": [], "count": 0}
            
            except Exception as e:
                print(f"❌ Error retrieving MCQ examples: {e}")
                return {"success": False, "documents": [], "count": 0}
    
    async def retrieve_theory_context(
        self,
        topic: Optional[str],
        subtopic: Optional[str],
        difficulty: Optional[str],
        k: int = 10
    ) -> Dict[str, Any]:
        """
        Retrieve theory Q&As from Theory RAG service.
        
        Returns:
            Dict with theory context
        """
        async with aiohttp.ClientSession() as session:
            try:
                payload = {
                    "topic": topic,
                    "subtopic": subtopic,
                    "difficulty": difficulty,
                    "k": k
                }
                
                async with session.post(
                    f"{self.theory_rag_url}/retrieve-theory",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ Retrieved {data.get('count', 0)} theory Q&As")
                        return data
                    else:
                        print(f"⚠️ Theory RAG returned status {response.status}")
                        return {"success": False, "theory_context": "", "documents": [], "count": 0}
            
            except Exception as e:
                print(f"❌ Error retrieving theory context: {e}")
                return {"success": False, "theory_context": "", "documents": [], "count": 0}
    
    async def retrieve_dual_context(
        self,
        subject: Optional[str],
        topic: Optional[str],
        difficulty: Optional[str],
        subtopic: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieve context from unified RAG service (MCQ + Theory).
        
        Returns:
            Combined context from RAG service
        """
        print(f"🔍 Retrieving context from unified RAG service...")
        print(f"   Subject: {subject}, Topic: {topic}, Difficulty: {difficulty}")
        
        async with aiohttp.ClientSession() as session:
            try:
                payload = {
                    "subject": subject,
                    "topic": topic,
                    "subtopic": subtopic,
                    "difficulty": difficulty,
                    "k": 20,
                    "retrieval_type": "both"
                }
                
                async with session.post(
                    f"{self.rag_service_url}/retrieve",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        mcq_result = data.get("mcq_examples", {"documents": [], "count": 0})
                        theory_result = data.get("theory_context", {"theory_context": "", "documents": [], "count": 0})
                        
                        print(f"✅ Retrieved {mcq_result.get('count', 0)} MCQ examples, {theory_result.get('count', 0)} theory items")
                        
                        return {
                            "mcq_examples": mcq_result,
                            "theory_context": theory_result
                        }
                    else:
                        print(f"⚠️ RAG service returned status {response.status}")
                        return {
                            "mcq_examples": {"documents": [], "count": 0},
                            "theory_context": {"theory_context": "", "documents": [], "count": 0}
                        }
            
            except Exception as e:
                print(f"❌ Error retrieving from RAG service: {e}")
                return {
                    "mcq_examples": {"documents": [], "count": 0},
                    "theory_context": {"theory_context": "", "documents": [], "count": 0}
                }
    
    def format_combined_prompt(
        self,
        subject: str,
        topic: str,
        difficulty: str,
        count: int,
        mcq_examples: Dict[str, Any],
        theory_context: Dict[str, Any]
    ) -> str:
        """Build a robust prompt with graceful degradation.

        Scenarios:
        1. Both theory + MCQ examples available
        2. Only theory available
        3. Only MCQ examples available
        4. Neither available (pure generation template)
        """

        mcq_docs = mcq_examples.get("documents", []) or []
        theory_text_raw = theory_context.get("theory_context", "") or ""
        theory_available = bool(theory_context.get("count", 0) and theory_text_raw.strip())
        mcq_available = bool(len(mcq_docs))

        # Build MCQ examples section (limit 8 for brevity)
        mcq_section = ""
        if mcq_available:
            formatted_examples = []
            for i, doc in enumerate(mcq_docs[:8]):
                content = doc.get("content", "").strip()
                if not content:
                    continue
                formatted_examples.append(f"Example {i+1}:\n{content}")
            mcq_section = "\n\n".join(formatted_examples)
        else:
            mcq_section = "(No prior MCQ examples retrieved – you must still output valid, well-structured MCQs.)"

        # Theory section
        if theory_available:
            theory_section = theory_text_raw.strip()
        else:
            theory_section = "(No explicit theory context retrieved. Use generally accepted domain knowledge—do NOT hallucinate niche facts. Prefer fundamentals and widely known concepts.)"

        # Dynamic guidance additions
        guidance_lines = []
        if not theory_available:
            guidance_lines.append("When explaining answers, reference core principles (definitions, properties, use-cases).")
        if not mcq_available:
            guidance_lines.append("Infer appropriate question structure; ensure clarity, avoid ambiguity.")
        if theory_available and mcq_available:
            guidance_lines.append("Blend theory depth with stylistic patterns from examples for balanced rigor.")
        guidance_lines.append("Never copy any example text verbatim.")
        guidance_lines.append("Ensure each explanation justifies why the correct option is right AND why others are wrong succinctly.")

        guidance_block = "\n- " + "\n- ".join(guidance_lines)

        prompt = f"""SYSTEM ROLE: You are an expert {subject} educator generating rigorous, original multiple-choice questions.

TARGET SPECIFICATION:
- Subject: {subject}
- Topic: {topic}
- Difficulty: {difficulty}
- Quantity: {count}
- Options per question: EXACTLY 4 (A,B,C,D)

CONTEXT A (Theory / Explanatory Knowledge):
{theory_section}

CONTEXT B (Prior MCQ Style Examples):
{mcq_section}

INSTRUCTIONS:
{guidance_block}
- Calibrate difficulty: '{difficulty}' means balanced cognitive load (mix conceptual recall + application reasoning).
- Avoid trivial repetition (each question must target a distinct micro-concept or angle).
- Distractors must be plausible but clearly incorrect upon reasoning.
- Do NOT include answers that are 'All of the above' or 'None of the above'.
- Avoid giving away answers inside the question wording.

OUTPUT STRICTLY:
Return ONLY a JSON array (no prose, no markdown) where each element matches this schema:
{{
  "question": "Clear standalone question ending with ?",
  "options": ["Option A","Option B","Option C","Option D"],
  "correct_option_index": <number 0-3>,
  "explanation": "1-3 sentence justification",
  "subject": "{subject}",
  "topic": "{topic}",
  "difficulty": "{difficulty}" 
}}

FAILURE MODES TO AVOID:
- Do NOT output markdown.
- Do NOT number questions externally.
- Do NOT include trailing commentary.

Generate now."""

        return prompt
    
    async def generate_questions_with_dual_rag(
        self,
        subject: Optional[str] = None,
        topic: Optional[str] = None,
        subtopic: Optional[str] = None,
        difficulty: Optional[str] = None,
        count: int = 5,
        use_retrieval: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Generate quiz questions using dual RAG context.
        
        Args:
            subject: Subject filter
            topic: Topic filter
            subtopic: Subtopic filter (for theory)
            difficulty: Difficulty level
            count: Number of questions to generate
            
        Returns:
            List of generated questions
        """
        print(f"\n{'='*80}")
        print(f"🚀 DUAL RAG QUIZ GENERATION")
        print(f"{'='*80}")
        
        # Step 1: Optional retrieval
        if use_retrieval:
            dual_context = await self.retrieve_dual_context(
                subject=subject,
                topic=topic,
                difficulty=difficulty,
                subtopic=subtopic
            )
            mcq_examples = dual_context["mcq_examples"]
            theory_context = dual_context["theory_context"]
        else:
            print("⚠️ use_retrieval=False -> Skipping RAG calls; generating with generic knowledge.")
            mcq_examples = {"documents": [], "count": 0}
            theory_context = {"theory_context": "", "documents": [], "count": 0}
        
        # Check if we have enough context
        if mcq_examples["count"] == 0:
            print("⚠️ No MCQ examples available.")
        if theory_context["count"] == 0:
            print("⚠️ No theory context available.")

        # Determine retrieval mode for metadata/logging
        if mcq_examples["count"] > 0 and theory_context["count"] > 0:
            retrieval_mode = "dual"
        elif mcq_examples["count"] > 0:
            retrieval_mode = "mcq_only"
        elif theory_context["count"] > 0:
            retrieval_mode = "theory_only"
        else:
            retrieval_mode = "none"
        print(f"🧭 Retrieval mode: {retrieval_mode}")
        
        # Step 2: Format combined prompt
        print("\n📝 Formatting combined prompt for Gemini...")
        prompt = self.format_combined_prompt(
            subject=subject or "Programming",
            topic=topic or "General",
            difficulty=difficulty or "medium",
            count=count,
            mcq_examples=mcq_examples,
            theory_context=theory_context
        )
        
        # Step 3: Generate with Gemini
        print("🤖 Generating questions with Gemini...")
        
        try:
            response = self.llm.generate_content(prompt)
            response_text = response.text
            
            # Extract JSON
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                questions = json.loads(json_text)
                
                # Validate questions
                valid_questions = []
                for q in questions:
                    if self._validate_question(q):
                        valid_questions.append(q)
                
                print(f"✅ Generated {len(valid_questions)} valid questions (mode={retrieval_mode})")
                print(f"{'='*80}\n")
                return valid_questions
            else:
                print("⚠️ No valid JSON found in Gemini response")
                return []
        
        except Exception as e:
            print(f"❌ Error generating questions (mode={retrieval_mode}): {e}")
            return []
    
    def _validate_question(self, question: Dict[str, Any]) -> bool:
        """Validate MCQ format"""
        required_fields = ["question", "options", "correct_option_index", "explanation"]
        
        for field in required_fields:
            if field not in question:
                return False
        
        if not isinstance(question["options"], list) or len(question["options"]) != 4:
            return False
        
        idx = question["correct_option_index"]
        if not isinstance(idx, int) or idx < 0 or idx >= 4:
            return False
        
        return True


async def main():
    """Example usage"""
    orchestrator = DualRAGOrchestrator()
    
    questions = await orchestrator.generate_questions_with_dual_rag(
        subject="Data Structures",
        topic="algorithms",
        subtopic="sorting",
        difficulty="medium",
        count=3
    )
    
    if questions:
        print("\n📊 Generated Questions:")
        print(json.dumps(questions, indent=2))
    else:
        print("\n❌ No questions generated")


if __name__ == "__main__":
    asyncio.run(main())
