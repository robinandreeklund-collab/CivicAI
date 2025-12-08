# Dockerfile for CivicAI with RunPod Support
# Multi-stage build for optimized image size

# Stage 1: Base image with Python and Node.js
FROM nvidia/cuda:12.1.0-base-ubuntu22.04 as base

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Stage 2: Python dependencies
FROM base as python-deps

# Copy Python requirements
COPY requirements.txt requirements-minimal.txt ./

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Stage 3: Application
FROM python-deps as app

# Copy application code
COPY . .

# Install Node.js dependencies for backend
WORKDIR /app/backend
RUN npm ci --only=production

# Install Node.js dependencies for frontend
WORKDIR /app/frontend
RUN npm ci

# Build frontend
RUN npm run build

# Create necessary directories
WORKDIR /app
RUN mkdir -p models/oneseek-certified \
    data \
    datasets \
    config \
    logs

# Set environment variables
ENV NODE_ENV=production
ENV PYTHONPATH=/app
ENV ML_SERVICE_URL=http://localhost:5000

# Runtime configuration
ENV RUNTIME_MODE=local
ENV RUNPOD_API_KEY=""
ENV RUNPOD_ENDPOINT_URL=""

# Expose ports
# 3001: Backend API
# 5000: ML Service
# 5173: Frontend (dev mode)
EXPOSE 3001 5000 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Start ML service in background\n\
echo "Starting ML service..."\n\
cd /app/ml_service\n\
python3 server.py --port 5000 &\n\
ML_PID=$!\n\
\n\
# Wait for ML service to be ready\n\
echo "Waiting for ML service..."\n\
for i in {1..30}; do\n\
    if curl -s http://localhost:5000/health > /dev/null; then\n\
        echo "ML service is ready"\n\
        break\n\
    fi\n\
    sleep 1\n\
done\n\
\n\
# Start backend\n\
echo "Starting backend..."\n\
cd /app/backend\n\
npm start &\n\
BACKEND_PID=$!\n\
\n\
# Wait for any process to exit\n\
wait -n\n\
\n\
# Exit with status of process that exited first\n\
exit $?\n\
' > /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Labels
LABEL maintainer="CivicAI Team"
LABEL description="CivicAI - Transparent AI platform with local and RunPod support"
LABEL version="1.0.0"
