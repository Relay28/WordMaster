@echo off
REM Start script for GECToR Grammar Service (Windows)

echo Starting GECToR Grammar Correction Service...

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install requirements
echo Installing requirements...
pip install -r requirements.txt

REM Start the service
echo Starting service on port 5001...
python gector_service.py

pause
