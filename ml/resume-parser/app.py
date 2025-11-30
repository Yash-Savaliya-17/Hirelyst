from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pypdf import PdfReader
import os
from langchain_core.messages import HumanMessage
from io import BytesIO
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from fastapi.middleware.cors import CORSMiddleware
import json

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://careerquest.jalaymovaliya.tech"],  # Allow your frontend URL    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
    allow_credentials=True,
)

# Retrieve the Google API key from the environment
gemini_api_key = os.getenv('GOOGLE_API_KEY')

# Initialize the Gemini model
model = ChatGoogleGenerativeAI(model="gemini-1.5-flash-002", google_api_key=gemini_api_key)

@app.post("/parse-resume/")
async def extract_text_from_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF file.")

    try:
        # Read the uploaded PDF file
        pdf_content = await file.read()
        pdf_file = BytesIO(pdf_content)

        reader = PdfReader(pdf_file)
        extracted_text = ""

        # Extract text from each page
        for page in reader.pages:
            extracted_text += page.extract_text()

        if not extracted_text:
            raise HTTPException(status_code=400, detail="Failed to extract text from the PDF.")

        # Create the message for the Gemini model
        message = HumanMessage(
            content=f"""
            Please extract the following details from this resume data and format them as a well-structured dictionary using camelCase keys. Do not include Python or JSON keywords; return the data directly in the specified structure:

            {{
                "name": "<string>",
                "contactInformation": {{
                    "phone": "<string>",
                    "email": "<string>",
                    "linkedIn": "<string>",
                    "gitHub": "<string>",
                    "address": "<string>",
                    "city": "<string>",
                    "state": "<string>"
                }},
                "education": [
                    {{
                        "grade": "<string>",
                        "fieldOfStudy": "<string>",
                        "institution": "<string>",
                        "location": "<string>",
                        "degree": "<string>",
                        "startDate": "<ISO string>",
                        "endDate": "<ISO string>",
                        "details": "<string>",
                        "cgpa": "<string>"
                    }}
                ],
                "skills": {{
                    "languages": ["<string>"],
                    "frameworks": ["<string>"],
                    "databases": ["<string>"],
                    "tools": ["<string>"]
                }},
                "experience": [
                    {{
                        "title": "<string>",
                        "company": "<string>",
                        "location": "<string>",
                        "startDate": "<ISO string>",
                        "endDate": "<ISO string>",
                        "description": "<string>"
                    }}
                ],
                "projects": [
                    {{
                        "name": "<string>",
                        "technologies": ["<string>"],
                        "description": "<string>",
                        "status": "<string>",
                        "startDate": "<ISO string>",
                        "endDate": "<ISO string>",
                        "link": "<string>"
                    }}
                ],
                "extracurricularActivities": [
                    {{
                        "name": "<string>",
                        "details": "<string>"
                    }}
                ],
                "codingPlatforms": [
                    {{
                        "name": "<string>",
                        "problemsSolved": "<string>",
                        "rating": "<string>",
                        "details": "<string>"
                    }}
                ]
            }}

            Here is the resume data:
            {extracted_text}
            """
        )

        # Invoke the Gemini model with the message
        response = model.invoke([message])
        # Debugging: Print the response content to check its format
        # print(f"Gemini response: {response.content}")
        cleaned_response = response.content.strip().strip("`").strip("json").strip()

        # Now parse the cleaned JSON string
        try:
            structured_data = json.loads(cleaned_response)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"Invalid JSON response: {str(e)}")

        return JSONResponse(content={"extracted_data": structured_data})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

