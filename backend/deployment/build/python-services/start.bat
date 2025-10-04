@echo off
setlocal enableextensions
echo === GECToR Grammar Correction Service (start.bat - safe mode) ===
echo Usage:
echo   start.bat                ^(default loads model^)
echo   start.bat fast           ^(heuristic only^)
echo   start.bat reinstall      ^(reinstall deps + model^)
echo   start.bat reinstall fast ^(reinstall deps only heuristic^)

REM Resolve script directory
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%" >nul 2>&1
if errorlevel 1 goto fail_dir

REM Parse flags manually (avoid paren IF blocks)
set FLAG1=%1
set FLAG2=%2
if /I "%FLAG1%"=="reinstall" set WANT_REINSTALL=1
if /I "%FLAG2%"=="reinstall" set WANT_REINSTALL=1
if /I "%FLAG1%"=="fast" set WANT_FAST=1
if /I "%FLAG2%"=="fast" set WANT_FAST=1

if defined WANT_FAST (
    rem do nothing here (just marker)
) else (
    set WANT_MODEL=1
)

REM Detect python
call :detect_python
if not defined PY goto fail_python

if exist .venv goto activate
echo [GECToR] Creating virtual environment (.venv)...
%PY% -m venv .venv
if errorlevel 1 goto fail_mkvenv

:activate
call .venv\Scripts\activate.bat
if errorlevel 1 goto fail_activate

echo [GECToR] Upgrading pip (quiet)...
python -m pip install --upgrade pip >nul 2>&1

if defined WANT_REINSTALL (
    echo [GECToR] Reinstalling dependencies...
    pip install --no-cache-dir -r requirements.txt
) else (
    echo [GECToR] Ensuring dependencies installed...
    pip install -r requirements.txt >nul
)
if errorlevel 1 echo [WARN] Some dependencies failed; heuristic mode may still function.

if defined WANT_MODEL (
    set GECTOR_LOAD_MODEL=1
    echo [GECToR] Transformer model load ENABLED (may take time first run)...
) else (
    echo [GECToR] FAST mode: heuristic-only (use without 'fast' to load model).
)

echo [GECToR] Launching service on port 5001...
python gector_service.py
set EXITCODE=%ERRORLEVEL%
echo [GECToR] Service exited with code %EXITCODE%
goto end

:detect_python
where py >nul 2>&1
if not errorlevel 1 set PY=py
if defined PY goto :eof
where python >nul 2>&1
if not errorlevel 1 set PY=python
goto :eof

:fail_dir
echo [ERROR] Could not change to script directory.
goto end
:fail_python
echo [ERROR] Python launcher not found (install Python 3.8+ and add to PATH).
goto end
:fail_mkvenv
echo [ERROR] Failed creating virtual environment.
goto end
:fail_activate
echo [ERROR] Failed activating virtual environment.
goto end

:end
popd >nul 2>&1
endlocal
pause
