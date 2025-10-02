#!/bin/bash
# Test script for WordMaster production deployment

EC2_IP="3.26.165.228"
BASE_URL="http://$EC2_IP:8080"

echo "🧪 Testing WordMaster Production Deployment"
echo "Base URL: $BASE_URL"
echo "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "="

# Test 1: Basic connectivity
echo "1️⃣ Testing basic connectivity..."
if ping -c 1 $EC2_IP > /dev/null 2>&1; then
    echo "✅ EC2 instance is reachable"
else
    echo "❌ Cannot reach EC2 instance"
    exit 1
fi

# Test 2: Port 8080 accessibility
echo -e "\n2️⃣ Testing port 8080 accessibility..."
if timeout 5 bash -c "</dev/tcp/$EC2_IP/8080"; then
    echo "✅ Port 8080 is open"
else
    echo "❌ Port 8080 is not accessible"
fi

# Test 3: Application health check
echo -e "\n3️⃣ Testing application health..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response "$BASE_URL/actuator/health" 2>/dev/null)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Application health check passed"
    cat /tmp/health_response
else
    echo "❌ Application health check failed (HTTP: $HEALTH_RESPONSE)"
fi

# Test 4: Authentication endpoint
echo -e "\n4️⃣ Testing authentication endpoint..."
AUTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/auth_response -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser'.date +%s'",
    "email": "test'.date +%s'@wordmaster.com",
    "password": "TestPassword123!",
    "fname": "Test",
    "lname": "User",
    "role": "USER_STUDENT"
  }' 2>/dev/null)

if [ "${AUTH_RESPONSE: -3}" = "200" ] || [ "${AUTH_RESPONSE: -3}" = "201" ]; then
    echo "✅ Authentication endpoint is working"
else
    echo "❌ Authentication endpoint failed (HTTP: ${AUTH_RESPONSE: -3})"
    echo "Response:"
    cat /tmp/auth_response
fi

# Test 5: Database connectivity (indirect)
echo -e "\n5️⃣ Testing database connectivity..."
if [ "${AUTH_RESPONSE: -3}" = "200" ] || [ "${AUTH_RESPONSE: -3}" = "201" ]; then
    echo "✅ Database appears to be connected (user registration worked)"
else
    echo "⚠️ Database connectivity unclear (auth test needed to pass first)"
fi

# Test 6: Python services
echo -e "\n6️⃣ Testing Python GECToR service..."
GECTOR_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/gector_response "http://$EC2_IP:5001/health" 2>/dev/null)
if [ "$GECTOR_RESPONSE" = "200" ]; then
    echo "✅ GECToR service is running"
else
    echo "⚠️ GECToR service may not be running (HTTP: $GECTOR_RESPONSE)"
fi

echo -e "\n🏁 Testing completed!"
echo "📋 Summary: Check the results above for any ❌ failures"
echo "🔗 Application URL: $BASE_URL"