@echo off
REM WordMaster Build Script for Windows
REM Run this from your local machine to build and prepare for deployment

echo Building WordMaster for production deployment...

REM Navigate to project directory
cd /d "c:\Users\T UP GAMING\OneDrive\Documents\GitHub\WordMaster\backend\wrdmstr"

REM Clean and build with Maven
echo Cleaning previous build...
call mvnw clean

echo Building JAR with production profile...
call mvnw package -DskipTests -Pprod

REM Check if build was successful
if exist "target\wrdmstr-0.0.1-SNAPSHOT.jar" (
    echo Build successful!
    
    REM Copy JAR to deployment folder
    mkdir "..\deployment\build" 2>nul
    copy "target\wrdmstr-0.0.1-SNAPSHOT.jar" "..\deployment\build\wordmaster.jar"
    
    REM Copy Python services
    xcopy "python-services" "..\deployment\build\python-services\" /E /Y
    
    echo Deployment files prepared in: backend\deployment\build\
    echo.
    echo Files to upload to EC2:
    echo - wordmaster.jar
    echo - python-services\ folder
    echo - env.sh (configured with your RDS details)
    echo.
    echo Next steps:
    echo 1. Configure env.sh with your RDS endpoint and credentials
    echo 2. Upload files to EC2 /opt/wordmaster/ directory
    echo 3. Run setup-ec2.sh on your EC2 instance
    echo 4. Run deploy.sh to start services
) else (
    echo Build failed! Check the output above for errors.
    pause
)

pause