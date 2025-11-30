import os
from typing import Dict, List
import json
from groq import Groq
import PyPDF2
import re
import streamlit as st
import pandas as pd
from pathlib import Path
import tempfile
from dotenv import load_dotenv
load_dotenv()

class ATSScorer:
    def __init__(self):
        # Get API key from environment variable
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables. Please check your .env file.")
        self.client = Groq(api_key=api_key)
        
    def extract_text_from_pdf(self, pdf_file) -> str:
        """Extract text content from a PDF file."""
        try:
            reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            return self._clean_text(text)
        except Exception as e:
            st.error(f"Error reading PDF: {str(e)}")
            return ""
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text content."""
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        return text
    
    def analyze_resume(self, resume_text: str, job_description: str) -> Dict:
        prompt = f"""
        You are an expert ATS (Applicant Tracking System) analyzer. Analyze the resume against the job description thoroughly.
        
        Evaluate the following aspects:
        1. Overall ATS Compatibility (format, keywords, parsing)
        2. Section-by-section analysis:
           - Header/Contact Info
           - Professional Summary/Objective
           - Work Experience
           - Skills
           - Education
           - Projects/Achievements
        3. Keyword matching and optimization
        4. Bullet point effectiveness
        5. Action verbs usage
        6. Quantifiable achievements
        
        For each weak area, provide:
        1. The current content
        2. Why it's not optimal
        3. A specific improved version
        4. Additional suggestions
        
        Resume:
        {resume_text}
        
        Job Description:
        {job_description}
        
        Provide the analysis in the following JSON format:
        {{
            "ats_score": <overall_score>,
            "format_score": <score>,
            "keyword_score": <score>,
            "section_scores": {{
                "header": <score>,
                "summary": <score>,
                "experience": <score>,
                "skills": <score>,
                "education": <score>
            }},
            "keyword_matches": [<list of found keywords>],
            "missing_keywords": [<list of missing important keywords>],
            "section_analysis": {{
                "header": {{
                    "issues": [<list of issues>],
                    "improvements": [<list of specific improvements>]
                }},
                "summary": {{
                    "issues": [<list of issues>],
                    "improvements": [<list of specific improvements>]
                }},
                "experience": {{
                    "issues": [<list of issues>],
                    "improvements": [<list of specific improvements>],
                    "weak_bullets": [
                        {{
                            "current": "<current bullet>",
                            "why_weak": "<explanation>",
                            "improved": "<improved version>"
                        }}
                    ]
                }},
                "skills": {{
                    "issues": [<list of issues>],
                    "improvements": [<list of specific improvements>]
                }},
                "education": {{
                    "issues": [<list of issues>],
                    "improvements": [<list of specific improvements>]
                }}
            }},
            "action_verbs_missing": [<list of recommended action verbs>],
            "formatting_issues": [<list of formatting issues>],
            "overall_recommendations": [<list of priority improvements>]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model="mixtral-8x7b-32768",
                messages=[
                    {"role": "system", "content": "You are an ATS expert. Provide detailed, actionable resume analysis."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            st.error(f"Error in analysis: {str(e)}")
            return {
                "ats_score": 0,
                "format_score": 0,
                "keyword_score": 0,
                "section_scores": {},
                "section_analysis": {},
                "formatting_issues": ["Error in analysis"],
                "overall_recommendations": ["Please try again"]
            }

def display_score_section(score: int, title: str):
    st.metric(title, f"{score}/100")
    color = "red" if score < 60 else "orange" if score < 80 else "green"
    st.progress(score/100, text=f"{score}%")
    
def main():
    st.set_page_config(page_title="Advanced ATS Resume Scorer", layout="wide")
    
    # Title and description
    st.title("📄 Advanced ATS Resume Scoring System")
    st.markdown("""
    This tool provides detailed ATS analysis of your resume against a job description, including:
    - Overall ATS Compatibility Score
    - Section-by-section Analysis
    - Keyword Optimization
    - Specific Improvement Suggestions
    - Bullet Point Enhancement
    """)

    # Main content
    col1, col2 = st.columns(2)
    
    with col1:
        st.header("Upload Resume")
        uploaded_file = st.file_uploader("Choose your resume (PDF)", type="pdf")
        
    with col2:
        st.header("Job Description")
        job_description = st.text_area("Paste the job description here", height=200)
    
    if uploaded_file and job_description:
        if st.button("Analyze Resume"):
            try:
                with st.spinner("Performing detailed resume analysis..."):
                    scorer = ATSScorer()
                    resume_text = scorer.extract_text_from_pdf(uploaded_file)
                    
                    if resume_text:
                        analysis = scorer.analyze_resume(resume_text, job_description)
                        
                        # Display Overall Scores
                        st.markdown("---")
                        st.header("Overall Scores")
                        score_cols = st.columns(3)
                        with score_cols[0]:
                            display_score_section(analysis['ats_score'], "Overall ATS Score")
                        with score_cols[1]:
                            display_score_section(analysis['format_score'], "Format Score")
                        with score_cols[2]:
                            display_score_section(analysis['keyword_score'], "Keyword Match Score")
                        
                        # Section Scores
                        st.markdown("---")
                        st.header("Section Analysis")
                        section_cols = st.columns(len(analysis['section_scores']))
                        for i, (section, score) in enumerate(analysis['section_scores'].items()):
                            with section_cols[i]:
                                display_score_section(score, section.title())
                        
                        # Detailed Section Analysis
                        st.markdown("---")
                        st.header("Detailed Feedback")
                        
                        tabs = st.tabs(["Header", "Summary", "Experience", "Skills", "Education"])
                        
                        for tab, section in zip(tabs, analysis['section_analysis'].keys()):
                            with tab:
                                section_data = analysis['section_analysis'][section]
                                
                                st.subheader("Issues Identified")
                                for issue in section_data['issues']:
                                    st.markdown(f"❌ {issue}")
                                
                                st.subheader("Suggested Improvements")
                                for improvement in section_data['improvements']:
                                    st.markdown(f"✅ {improvement}")
                                
                                # Special handling for experience section's weak bullets
                                if section == 'experience' and 'weak_bullets' in section_data:
                                    st.subheader("Bullet Point Improvements")
                                    for bullet in section_data['weak_bullets']:
                                        with st.expander(f"Improve: {bullet['current'][:50]}..."):
                                            st.markdown("**Current Version:**")
                                            st.markdown(f"```{bullet['current']}```")
                                            st.markdown("**Why it needs improvement:**")
                                            st.markdown(bullet['why_weak'])
                                            st.markdown("**Improved Version:**")
                                            st.markdown(f"```{bullet['improved']}```")
                        
                        # Keyword Analysis
                        st.markdown("---")
                        st.header("Keyword Analysis")
                        key_cols = st.columns(2)
                        with key_cols[0]:
                            st.subheader("Found Keywords")
                            for keyword in analysis['keyword_matches']:
                                st.markdown(f"✅ {keyword}")
                        with key_cols[1]:
                            st.subheader("Missing Keywords")
                            for keyword in analysis['missing_keywords']:
                                st.markdown(f"❌ {keyword}")
                        
                        # Action Verbs
                        if analysis.get('action_verbs_missing'):
                            st.markdown("---")
                            st.header("Recommended Action Verbs")
                            st.markdown("Consider using these powerful action verbs:")
                            st.markdown(", ".join(analysis['action_verbs_missing']))
                        
                        # Format Issues
                        if analysis.get('formatting_issues'):
                            st.markdown("---")
                            st.header("Formatting Issues")
                            for issue in analysis['formatting_issues']:
                                st.markdown(f"🔧 {issue}")
                        
                        # Download Report
                        st.markdown("---")
                        report = generate_detailed_report(analysis)
                        st.download_button(
                            label="Download Detailed Analysis Report",
                            data=report,
                            file_name="detailed_ats_analysis.txt",
                            mime="text/plain"
                        )
            except ValueError as e:
                st.error(str(e))  # Display error if API key is not found
                st.info("Please ensure GROQ_API_KEY is properly set in your .env file.")
    else:
        st.info("Please upload a resume, and paste a job description to begin the analysis.")

def generate_detailed_report(analysis: Dict) -> str:
    """Generate a detailed text report from the analysis results."""
    report = []
    report.append("=== ATS RESUME ANALYSIS REPORT ===\n")
    
    # Overall Scores
    report.append("OVERALL SCORES")
    report.append(f"ATS Score: {analysis['ats_score']}/100")
    report.append(f"Format Score: {analysis['format_score']}/100")
    report.append(f"Keyword Score: {analysis['keyword_score']}/100\n")
    
    # Section Scores
    report.append("SECTION SCORES")
    for section, score in analysis['section_scores'].items():
        report.append(f"{section.title()}: {score}/100")
    report.append("")
    
    # Detailed Section Analysis
    report.append("DETAILED SECTION ANALYSIS")
    for section, data in analysis['section_analysis'].items():
        report.append(f"\n{section.upper()}")
        report.append("\nIssues:")
        for issue in data['issues']:
            report.append(f"- {issue}")
        report.append("\nImprovements:")
        for improvement in data['improvements']:
            report.append(f"+ {improvement}")
        
        if section == 'experience' and 'weak_bullets' in data:
            report.append("\nBullet Point Improvements:")
            for bullet in data['weak_bullets']:
                report.append(f"\nCurrent: {bullet['current']}")
                report.append(f"Why weak: {bullet['why_weak']}")
                report.append(f"Improved: {bullet['improved']}")
    
    # Keywords
    report.append("\nKEYWORD ANALYSIS")
    report.append("\nFound Keywords:")
    for keyword in analysis['keyword_matches']:
        report.append(f"+ {keyword}")
    report.append("\nMissing Keywords:")
    for keyword in analysis['missing_keywords']:
        report.append(f"- {keyword}")
    
    return "\n".join(report)

if __name__ == "__main__":
    main()

# import os
# from typing import Dict, List
# import json
# from groq import Groq
# import PyPDF2
# import re
# import streamlit as st
# from pathlib import Path
# from dotenv import load_dotenv

# load_dotenv()

# class ATSScorer:
#     def __init__(self):
#         # Get API key from environment variable
#         api_key = os.getenv('GROQ_API_KEY')
#         if not api_key:
#             raise ValueError("GROQ_API_KEY not found in environment variables. Please check your .env file.")
#         self.client = Groq(api_key=api_key)

#     def extract_text_from_pdf(self, pdf_file) -> str:
#         """Extract text content from a PDF file."""
#         try:
#             reader = PyPDF2.PdfReader(pdf_file)
#             text = ""
#             for page in reader.pages:
#                 try:
#                     page_text = page.extract_text()
#                     text += page_text
#                 except UnicodeDecodeError as e:
#                     st.error(f"Unicode decode error on page: {e}")
#                     continue
#             return self._clean_text(text)
#         except Exception as e:
#             st.error(f"Error reading PDF: {str(e)}")
#             return ""


#     def _clean_text(self, text: str) -> str:
#         """Clean and normalize text content."""
#         text = re.sub(r'\s+', ' ', text)
#         text = text.strip()
#         return text

#     def analyze_resume(self, resume_text: str, job_description: str) -> Dict:
#         prompt = f"""
#         You are an expert ATS (Applicant Tracking System) analyzer. Analyze the resume against the job description thoroughly.
        
#         Evaluate the following aspects:
#         1. Overall ATS Compatibility (format, keywords, parsing)
#         2. Section-by-section analysis:
#            - Header/Contact Info
#            - Professional Summary/Objective
#            - Work Experience
#            - Skills
#            - Education
#            - Projects
#            - Achievements
#            - Profile
#         3. Keyword matching and optimization
#         4. Bullet point effectiveness
#         5. Action verbs usage
#         6. Quantifiable achievements
        
#         For each section, provide:
#         1. Issues identified
#         2. Specific improvements
#         3. Weak points (if applicable) and their improved versions
        
#         Provide the analysis in the following JSON format:
#         {{
#             "ats_score": <strict_score>,
#             "format_score": <strict_score>,
#             "keyword_score": <strict_score>,
#             "section_scores": {{
#                 "header": <strict_score>,
#                 "summary": <strict_score>,
#                 "experience": <strict_score>,
#                 "skills": <strict_score>,
#                 "education": <strict_score>,
#                 "projects": <strict_score>,
#                 "achievements": <strict_score>,
#                 "profile": <strict_score>
#             }},
#             "keyword_matches": [<list of found keywords>],
#             "missing_keywords": [<list of missing important keywords>],
#             "section_analysis": {{
#                 "header": {{
#                     "issues": [<list of issues>],
#                     "improvements": [<list of specific improvements>]
#                 }},
#                 "summary": {{
#                     "issues": [<list of issues>],
#                     "improvements": [<list of specific improvements>]
#                 }},
#                 "experience": {{
#                     "issues": [<list of issues>],
#                     "improvements": [<list of specific improvements>],
#                     "weak_bullets": [
#                         {{
#                             "current": "<current bullet>",
#                             "why_weak": "<explanation>",
#                             "improved": "<improved version>"
#                         }}
#                     ]
#                 }},
#                 "projects": {{
#                     "issues": [<list of issues>],
#                     "improvements": [<list of specific improvements>],
#                     "weak_bullets": [
#                         {{
#                             "current": "<current bullet>",
#                             "why_weak": "<explanation>",
#                             "improved": "<improved version>"
#                         }}
#                     ]
#                 }},
#                 "achievements": {{
#                     "issues": [<list of issues>],
#                     "improvements": [<list of specific improvements>],
#                     "weak_bullets": [
#                         {{
#                             "current": "<current bullet>",
#                             "why_weak": "<explanation>",
#                             "improved": "<improved version>"
#                         }}
#                     ]
#                 }},
#                 "profile": {{
#                     "issues": [<list of issues>],
#                     "improvements": [<list of specific improvements>]
#                 }}
#             }},
#             "action_verbs_missing": [<list of recommended action verbs>],
#             "formatting_issues": [<list of formatting issues>],
#             "overall_recommendations": [<list of priority improvements>]
#         }}
#         """

#         try:
#             response = self.client.chat.completions.create(
#                 model="mixtral-8x7b-32768",
#                 messages=[
#                     {"role": "system", "content": "You are an ATS expert. Provide detailed, actionable resume analysis."},
#                     {"role": "user", "content": prompt}
#                 ],
#                 temperature=0.1,
#                 max_tokens=2000
#             )
#             return json.loads(response.choices[0].message.content)
#         except Exception as e:
#             st.error(f"Error in analysis: {str(e)}")
#             return {
#                 "ats_score": 0,
#                 "format_score": 0,
#                 "keyword_score": 0,
#                 "section_scores": {},
#                 "section_analysis": {},
#                 "keyword_matches": [],
#                 "missing_keywords": [],
#                 "formatting_issues": ["Error in analysis"],
#                 "overall_recommendations": ["Please try again"]
#             }

# def display_score_section(score: int, title: str):
#     st.metric(title, f"{score}/100")
#     color = "red" if score < 40 else "orange" if score < 70 else "green"
#     st.progress(score / 100, text=f"{score}%")

# def main():
#     st.set_page_config(page_title="Advanced ATS Resume Scorer", layout="wide")

#     # Title and description
#     st.title("Advanced ATS Resume Scoring System")
#     st.markdown("""
#     This tool provides detailed ATS analysis of your resume against a job description, including:
#     - Overall ATS Compatibility Score
#     - Section-by-section Analysis
#     - Keyword Optimization
#     - Specific Improvement Suggestions
#     - Bullet Point Enhancement
#     """)

#     # Main content
#     col1, col2 = st.columns(2)

#     with col1:
#         st.header("Upload Resume")
#         uploaded_file = st.file_uploader("Choose your resume (PDF)", type="pdf")

#     with col2:
#         st.header("Job Description")
#         job_description = st.text_area("Paste the job description here", height=200)

#     if uploaded_file and job_description:
#         if st.button("Analyze Resume"):
#             try:
#                 with st.spinner("Performing detailed resume analysis..."):
#                     scorer = ATSScorer()
#                     resume_text = scorer.extract_text_from_pdf(uploaded_file)

#                     if resume_text:
#                         analysis = scorer.analyze_resume(resume_text, job_description)

#                         # Display Overall Scores
#                         st.markdown("---")
#                         st.header("Overall Scores")
#                         score_cols = st.columns(3)
#                         with score_cols[0]:
#                             display_score_section(analysis['ats_score'], "Overall ATS Score")
#                         with score_cols[1]:
#                             display_score_section(analysis['format_score'], "Format Score")
#                         with score_cols[2]:
#                             display_score_section(analysis['keyword_score'], "Keyword Match Score")

#                         # Section Scores
#                         st.markdown("---")
#                         st.header("Section Analysis")

#                         if analysis['section_scores']:
#                             section_count = len(analysis['section_scores'])
#                             if section_count > 0:
#                                 section_cols = st.columns(section_count)  # Valid number of columns
#                                 for i, (section, score) in enumerate(analysis['section_scores'].items()):
#                                     with section_cols[i]:
#                                         display_score_section(score, section.title())
#                             else:
#                                 st.warning("No section scores available for analysis.")
#                         else:
#                             st.error("Section scores data is missing or invalid.")


#                         # Detailed Section Analysis
#                         st.markdown("---")
#                         st.header("Detailed Feedback")

#                         tabs = st.tabs(["Header", "Summary", "Experience", "Skills", "Education", "Projects", "Achievements", "Profile"])

#                         for tab, section in zip(tabs, analysis['section_analysis'].keys()):
#                             with tab:
#                                 section_data = analysis['section_analysis'][section]

#                                 st.subheader("Issues Identified")
#                                 for issue in section_data['issues']:
#                                     st.markdown(f"\u274c {issue}")

#                                 st.subheader("Suggested Improvements")
#                                 for improvement in section_data['improvements']:
#                                     st.markdown(f"\u2705 {improvement}")

#                                 # Special handling for sections with weak bullets
#                                 if 'weak_bullets' in section_data:
#                                     st.subheader("Bullet Point Improvements")
#                                     for bullet in section_data['weak_bullets']:
#                                         with st.expander(f"Improve: {bullet['current'][:50]}..."):
#                                             st.markdown("**Current Version:**")
#                                             st.markdown(f"```{bullet['current']}```")
#                                             st.markdown("**Why it needs improvement:**")
#                                             st.markdown(bullet['why_weak'])
#                                             st.markdown("**Improved Version:**")
#                                             st.markdown(f"```{bullet['improved']}```")

#                         # Keyword Analysis
#                         st.markdown("---")
#                         st.header("Keyword Analysis")
#                         key_cols = st.columns(2)
#                         with key_cols[0]:
#                             st.subheader("Found Keywords")
#                             for keyword in analysis['keyword_matches']:
#                                 st.markdown(f"\u2705 {keyword}")
#                         with key_cols[1]:
#                             st.subheader("Missing Keywords")
#                             for keyword in analysis['missing_keywords']:
#                                 st.markdown(f"\u274c {keyword}")

#                         # Action Verbs
#                         if analysis.get('action_verbs_missing'):
#                             st.markdown("---")
#                             st.header("Recommended Action Verbs")
#                             st.markdown("Consider using these powerful action verbs:")
#                             st.markdown(", ".join(analysis['action_verbs_missing']))

#                         # Format Issues
#                         if analysis.get('formatting_issues'):
#                             st.markdown("---")
#                             st.header("Formatting Issues")
#                             for issue in analysis['formatting_issues']:
#                                 st.markdown(f"\ud83d\udd27 {issue}")

#                         # Download Report
#                         st.markdown("---")
#                         report = generate_detailed_report(analysis)
#                         st.download_button(
#                             label="Download Detailed Analysis Report",
#                             data=report,
#                             file_name="detailed_ats_analysis.txt",
#                             mime="text/plain"
#                         )
#             except ValueError as e:
#                 st.error(str(e))  # Display error if API key is not found
#                 st.info("Please ensure GROQ_API_KEY is properly set in your .env file.")
#     else:
#         st.info("Please upload a resume, and paste a job description to begin the analysis.")

# def generate_detailed_report(analysis: Dict) -> str:
#     """Generate a detailed text report from the analysis results."""
#     report = []
#     report.append("=== ATS RESUME ANALYSIS REPORT ===\n")
    
#     # Overall Scores
#     report.append("OVERALL SCORES")
#     report.append(f"ATS Score: {analysis['ats_score']}/100")
#     report.append(f"Format Score: {analysis['format_score']}/100")
#     report.append(f"Keyword Score: {analysis['keyword_score']}/100\n")
    
#     # Section Scores
#     report.append("SECTION SCORES")
#     for section, score in analysis['section_scores'].items():
#         report.append(f"{section.title()}: {score}/100")
#     report.append("")
    
#     # Detailed Section Analysis
#     report.append("DETAILED SECTION ANALYSIS")
#     for section, data in analysis['section_analysis'].items():
#         report.append(f"\n{section.upper()}")
        
#         report.append("\nIssues:")
#         for issue in data.get('issues', []):
#             report.append(f"- {issue}")
        
#         report.append("\nImprovements:")
#         for improvement in data.get('improvements', []):
#             report.append(f"+ {improvement}")
        
#         # Handle weak bullets for all relevant sections
#         if 'weak_bullets' in data:
#             report.append("\nBullet Point Improvements:")
#             for bullet in data['weak_bullets']:
#                 report.append(f"\nCurrent: {bullet['current']}")
#                 report.append(f"Why weak: {bullet['why_weak']}")
#                 report.append(f"Improved: {bullet['improved']}")
    
#     # Keywords
#     report.append("\nKEYWORD ANALYSIS")
#     report.append("\nFound Keywords:")
#     for keyword in analysis.get('keyword_matches', []):
#         report.append(f"+ {keyword}")
#     report.append("\nMissing Keywords:")
#     for keyword in analysis.get('missing_keywords', []):
#         report.append(f"- {keyword}")
    
#     # Formatting Issues
#     if analysis.get('formatting_issues'):
#         report.append("\nFORMATTING ISSUES")
#         for issue in analysis['formatting_issues']:
#             report.append(f"- {issue}")
    
#     # Action Verbs
#     if analysis.get('action_verbs_missing'):
#         report.append("\nRECOMMENDED ACTION VERBS")
#         report.append("Consider using these powerful action verbs:")
#         report.append(", ".join(analysis['action_verbs_missing']))
    
#     # Overall Recommendations
#     if analysis.get('overall_recommendations'):
#         report.append("\nOVERALL RECOMMENDATIONS")
#         for recommendation in analysis['overall_recommendations']:
#             report.append(f"- {recommendation}")
    
#     return "\n".join(report)

# if __name__ == "__main__":
#     main()