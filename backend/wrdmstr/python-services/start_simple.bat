@echo off
setlocal enableextensions
echo === Simple GECToR Starter (paren-safe) ===

REM Resolve script dir
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%" >nul 2>&1
if errorlevel 1 goto :fail_dir

REM Detect python launcher
where py >nul 2>&1 && (set PY=py)
if not defined PY where python >nul 2>&1 && (set PY=python)
if not defined PY goto :fail_nopy

if not exist .venv goto :mkvenv
goto :activate

:mkvenv
echo Creating .venv...
%PY% -m venv .venv
if errorlevel 1 goto :fail_mkvenv

:activate
call .venv\Scripts\activate.bat
if errorlevel 1 goto :fail_activate

echo Upgrading pip (quiet)...
python -m pip install --upgrade pip >nul 2>&1

echo Installing deps...
pip install -r requirements.txt
if errorlevel 1 echo [WARN] Some dependencies failed; continuing (heuristic mode still works)

if /I "%1"=="model" set GECTOR_LOAD_MODEL=1
if defined GECTOR_LOAD_MODEL echo Model load requested (large download if first time)...

echo Starting service on port 5001...
python gector_service.py
set EXITCODE=%ERRORLEVEL%
echo Service exited with code %EXITCODE%
goto :end

:fail_dir
echo [ERROR] Could not change to script directory.
goto :end
:fail_nopy
echo [ERROR] Python launcher not found in PATH.
goto :end
:fail_mkvenv
echo [ERROR] Failed to create virtual environment.
goto :end
:fail_activate
echo [ERROR] Failed to activate virtual environment.
goto :end

:end
popd >nul 2>&1
endlocal
pause
