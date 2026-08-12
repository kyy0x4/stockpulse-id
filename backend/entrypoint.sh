#!/bin/sh
set -e

if [ "$JOB_REFRESH" = "1" ]; then
    echo "[entrypoint] running refresh job"
    python -m app.jobs.refresh
    exit 0
fi

echo "[entrypoint] starting API server"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers 1