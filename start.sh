#!/bin/sh
set -e

# If frontend dist directory does not exist, build frontend
if [ ! -d "frontend/dist" ] && [ -f "frontend/package.json" ]; then
  echo "Building frontend..."
  cd frontend && npm install && npm run build && cd ..
fi

cd backend
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
