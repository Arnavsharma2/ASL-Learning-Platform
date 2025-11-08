#!/bin/bash
# Run backend using venv Python (works even if conda is active)

cd "$(dirname "$0")"
./venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000
