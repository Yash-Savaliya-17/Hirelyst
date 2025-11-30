# # FROM python:3.10-slim

# # WORKDIR /app

# # COPY . .

# # RUN pip install --no-cache-dir -r requirements.txt

# # CMD ["hypercorn", "app:app", "--bind", "0.0.0.0:8000"]

# FROM python:3.10-slim

# RUN apt-get update && apt-get install -y \
#     libgl1 \
#     libglib2.0-0 \
#  && rm -rf /var/lib/apt/lists/*

# WORKDIR /app

# COPY requirements.txt .

# RUN pip install --no-cache-dir -r requirements.txt

# COPY . .

# CMD ["hypercorn", "app:app", "--bind", "0.0.0.0:8000"]

FROM python:3.10-slim

# Avoid interactive prompts and speed up installation
ENV DEBIAN_FRONTEND=noninteractive
ENV PIP_DEFAULT_TIMEOUT=200

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Upgrade pip + set faster mirror + increase timeout
RUN pip install --upgrade pip wheel setuptools \
 && pip install --no-cache-dir --default-timeout=200 \
    -i https://pypi.tuna.tsinghua.edu.cn/simple \
    -r requirements.txt

# Copy project files
COPY . .

# Run app
CMD ["hypercorn", "app:app", "--bind", "0.0.0.0:8000"]
