#!/bin/bash
# Start script for GECToR Grammar Service

echo "Starting GECToR Grammar Correction Service..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Start the service
echo "Starting service on port 5001..."
python gector_service.py
