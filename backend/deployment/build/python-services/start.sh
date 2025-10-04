#!/bin/bash
# GECToR Grammar Correction Service - Advanced Startup Script
# Usage:
#   ./start.sh              (heuristic mode - lightweight)
#   ./start.sh model        (load full AI model - requires 3GB+ space)
#   ./start.sh reinstall    (reinstall deps, heuristic mode)

set -e  # Exit on error

echo "=== GECToR Grammar Correction Service ==="

# Parse arguments
WANT_MODEL=0
WANT_REINSTALL=0

for arg in "$@"; do
    case "$arg" in
        model)
            WANT_MODEL=1
            ;;
        reinstall)
            WANT_REINSTALL=1
            ;;
    esac
done

# Create virtual environment if needed
if [ ! -d "venv" ]; then
    echo "[GECToR] Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "[GECToR] Upgrading pip..."
python -m pip install --upgrade pip > /dev/null 2>&1

# Install dependencies
if [ "$WANT_REINSTALL" -eq 1 ]; then
    echo "[GECToR] Reinstalling dependencies..."
    pip install --no-cache-dir -r requirements.txt
else
    echo "[GECToR] Ensuring dependencies installed..."
    pip install -r requirements.txt > /dev/null 2>&1 || echo "[WARN] Some dependencies failed; heuristic mode may still work."
fi

# Set model loading flag
if [ "$WANT_MODEL" -eq 1 ]; then
    export GECTOR_LOAD_MODEL=1
    echo "[GECToR] Transformer model load ENABLED (requires 3GB+ free space)..."
else
    export GECTOR_LOAD_MODEL=0
    echo "[GECToR] FAST mode: heuristic-only (use './start.sh model' to load AI model)."
fi

# Start the service
echo "[GECToR] Launching service on port 5001..."
python3 gector_service.py
