env.sh:
#!/bin/bash
# AWS Environment Variables for WordMaster Backend
# Save this as /opt/wordmaster/env.sh on your EC2 instance
 
# Database Configuration (Replace with your actual RDS endpoint and credentials)
export RDS_ENDPOINT="wordmasterdatabase.cjmqw6a6e2xa.ap-southeast-2.rds.amazonaws.com"
export DB_USERNAME="admin"
export DB_PASSWORD="Wordmastercapstone12"
 
# JWT Secret (Generate a new one for production)
export JWT_SECRET="5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437"
 
# Azure AD Configuration (Use your existing values)
export AZURE_TENANT_ID="823cde44-4433-456d-b801-bdf0ab3d41fc"
export AZURE_CLIENT_ID="baf94424-d7ef-4a0e-8023-7e8834a14c3a"
export AZURE_CLIENT_SECRET="cIw8Q~Bbl8bkOkk4df776x6~6fnEdY~rSUiJ~bcl"
 
# Frontend URL (Update when you deploy frontend)
export FRONTEND_URL="https://wordmaster-nu.vercel.app"
 
# AI Configuration
export GEMINI_API_KEY="AIzaSyC7EK8s7f60-baq85BVhAlIiekwBVCyrbs"
 
# Java Options for Production
export JAVA_OPTS="-Xmx750m -Xms512m -server -Dspring.profiles.active=prod"
 
echo "Environment variables loaded successfully!"