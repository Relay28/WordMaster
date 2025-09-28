#!/usr/bin/env pwsh
# PowerShell script to build Spring Boot JAR properly

$projectPath = "C:\Users\T UP GAMING\OneDrive\Documents\GitHub\WordMaster\backend\wrdmstr"
$shortPath = (Get-Item $projectPath).PSPath -replace 'Microsoft.PowerShell.Core\\FileSystem::', ''

Write-Host "Building Spring Boot application..."
Write-Host "Project path: $projectPath"

# Set Java home
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"

# Change to project directory
Set-Location $projectPath

# Try using Maven wrapper with proper escaping
try {
    Write-Host "Attempting to build JAR..."
    & cmd.exe /c "mvnw.cmd clean package -DskipTests -q"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Build successful!"
        
        # Check if JAR was created
        $jarPath = Join-Path $projectPath "target\wrdmstr-0.0.1-SNAPSHOT.jar"
        if (Test-Path $jarPath) {
            $jarSize = (Get-Item $jarPath).Length
            Write-Host "JAR created: $jarSize bytes"
            
            # Copy to deployment folder
            $deployPath = "C:\Users\T UP GAMING\OneDrive\Documents\GitHub\WordMaster\backend\deployment\build\wordmaster.jar"
            Copy-Item $jarPath $deployPath -Force
            Write-Host "JAR copied to deployment folder"
        }
    } else {
        Write-Host "Build failed with exit code: $LASTEXITCODE"
    }
} catch {
    Write-Host "Error during build: $($_.Exception.Message)"
}

Write-Host "Build script completed."