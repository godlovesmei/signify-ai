FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    APP_DEBUG=false \
    MODEL_PATH=models/exports/bisindo_yolo/best.pt \
    INPUT_SIZE=640 \
    CONFIDENCE_THRESHOLD=0.5 \
    INFERENCE_TIMEOUT_SECONDS=5 \
    REQUIRE_AUTH=false \
    PORT=8000

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      libglib2.0-0 \
      libgl1 \
      libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY apps/backend/requirements.txt ./requirements.txt

RUN python -m pip install --upgrade pip \
    && python -m pip install \
      --index-url https://download.pytorch.org/whl/cpu \
      torch==2.5.1 \
      torchvision==0.20.1 \
    && python -m pip install -r requirements.txt

COPY apps/backend/ ./
COPY models/exports/bisindo_yolo/best.pt ./models/exports/bisindo_yolo/best.pt

RUN useradd --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).read()"

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers"]
