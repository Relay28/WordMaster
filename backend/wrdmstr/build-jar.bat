@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-21"
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM Change to project directory
cd /d "%~dp0"

REM Clean and build
echo Cleaning previous build...
call mvnw.cmd clean

echo Building executable JAR...
call mvnw.cmd package -DskipTests

echo Build complete!
pause