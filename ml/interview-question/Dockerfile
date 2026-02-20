FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["hypercorn", "FixQuestion.app:app", "--bind", "0.0.0.0:8000", "--access-logfile", "-"]
