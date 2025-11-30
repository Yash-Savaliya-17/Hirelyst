FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY dual_rag_orchestrator.py .
COPY api.py .

# Expose port
EXPOSE 8000

# Run the API
CMD ["python", "api.py", "--port", "8000"]
