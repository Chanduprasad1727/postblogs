# Multi-stage Dockerfile for Kalaga Wealth Platform on Railway

# ----------------------------------------------------
# Stage 1: Build the Vite / React Frontend
# ----------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# Pass Supabase environment credentials for client build
ARG VITE_SUPABASE_URL=https://nqgtjapaarsrhumfprfc.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZ3RqYXBhYXJzcmh1bWZwcmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5OTg2ODYsImV4cCI6MjExMDU3NDY4Nn0.x4XQ8UnBQzcTBUtGosJaIeXllgdrmNCCslw7lAvIOLg

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ----------------------------------------------------
# Stage 2: Python Backend Environment & Production Runner
# ----------------------------------------------------
FROM python:3.11-slim
WORKDIR /app

# Install curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application
COPY backend/ ./backend/

# Copy compiled frontend distribution from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Switch to backend directory
WORKDIR /app/backend
RUN mkdir -p uploads

# Dynamic port binding (Railway injects $PORT)
ENV PORT=8000
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Start Uvicorn bound to 0.0.0.0:$PORT
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
