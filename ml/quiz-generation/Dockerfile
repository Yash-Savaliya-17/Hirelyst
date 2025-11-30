FROM python:3.11-slim

WORKDIR /app

# Copy only requirements first (for better caching)
COPY requirements.txt .

# Install dependencies with retry, timeout, and faster mirror
RUN pip install --no-cache-dir -r requirements.txt \
    --timeout 300 --retries 10 -i https://pypi.org/simple \
    || pip install --no-cache-dir -r requirements.txt \
    --timeout 300 --retries 10 -i https://pypi.org/simple

# Copy the rest of your app
COPY . .

# Expose port (optional, for clarity)
EXPOSE 8000

# Start the app with hypercorn
CMD ["hypercorn", "app:app", "--bind", "0.0.0.0:8000"]
