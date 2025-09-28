#!/bin/bash
# WordMaster Application Startup Script
# Save this as /opt/wordmaster/run-app.sh on EC2

cd /opt/wordmaster

# Load environment variables
source /opt/wordmaster/env.sh

# Set Spring profile to production
export SPRING_PROFILES_ACTIVE=prod

# Kill any existing WordMaster processes
echo "Stopping any existing WordMaster processes..."
pkill -f wordmaster.jar

# Wait a moment for cleanup
sleep 3

# Start Spring Boot application
echo "Starting WordMaster application..."
echo "RDS_ENDPOINT: $RDS_ENDPOINT"
echo "DB_USERNAME: $DB_USERNAME"
echo "Using profile: $SPRING_PROFILES_ACTIVE"

# Run the application with environment variables
java -Xmx750m -Xms512m -Dspring.profiles.active=prod -jar wordmaster.jar > /opt/wordmaster/logs/app.log 2>&1 &

# Get the process ID
APP_PID=$!
echo "WordMaster started with PID: $APP_PID"
echo $APP_PID > /opt/wordmaster/wordmaster.pid

# Wait a few seconds and check if it's still running
sleep 5
if ps -p $APP_PID > /dev/null; then
    echo "✅ WordMaster application started successfully!"
    echo "Application is accessible at: http://3.26.165.228:8080"
else
    echo "❌ Failed to start WordMaster application"
    echo "Check logs at: /opt/wordmaster/logs/app.log"
    exit 1
fi