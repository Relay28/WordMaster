#!/bin/bash
# Complete deployment script for WordMaster to EC2

set -e  # Exit on any error

EC2_IP="3.26.165.228"
KEY_PATH="wordmasterec2key.pem"  # Update with your actual key path
DEPLOY_DIR="/opt/wordmaster"

echo "🚀 Starting WordMaster Deployment to EC2..."

# Check if key file exists
if [ ! -f "$KEY_PATH" ]; then
    echo "❌ SSH key not found at $KEY_PATH"
    echo "Please update KEY_PATH in this script or place your key file in the correct location"
    exit 1
fi

# Test connection first
echo "📡 Testing EC2 connection..."
ssh -i "$KEY_PATH" -o ConnectTimeout=10 ec2-user@$EC2_IP "echo 'Connection successful!'" || {
    echo "❌ Cannot connect to EC2 instance"
    exit 1
}

# Create directory structure on EC2
echo "📁 Creating directory structure..."
ssh -i "$KEY_PATH" ec2-user@$EC2_IP << EOF
sudo mkdir -p $DEPLOY_DIR/logs
sudo mkdir -p $DEPLOY_DIR/python-services
sudo chown -R ec2-user:ec2-user $DEPLOY_DIR
EOF

# Copy files to EC2
echo "📦 Copying application files..."
scp -i "$KEY_PATH" env.sh ec2-user@$EC2_IP:$DEPLOY_DIR/
scp -i "$KEY_PATH" build/wordmaster.jar ec2-user@$EC2_IP:$DEPLOY_DIR/
scp -i "$KEY_PATH" build/run-app.sh ec2-user@$EC2_IP:$DEPLOY_DIR/
scp -r -i "$KEY_PATH" build/python-services/* ec2-user@$EC2_IP:$DEPLOY_DIR/python-services/

# Set permissions and start services
echo "🔧 Setting up permissions and starting services..."
ssh -i "$KEY_PATH" ec2-user@$EC2_IP << EOF
cd $DEPLOY_DIR

# Make scripts executable
chmod +x env.sh
chmod +x run-app.sh
chmod +x python-services/start.sh

# Start Python services first
echo "Starting Python GECToR service..."
cd python-services
./start.sh &
cd ..

# Wait a moment for Python service to start
sleep 5

# Start Spring Boot application
echo "Starting WordMaster application..."
./run-app.sh

echo "🎉 Deployment completed successfully!"
echo "Application should be available at: http://$EC2_IP:8080"
EOF

echo "✅ Deployment script finished!"
echo "🔗 Access your application at: http://$EC2_IP:8080"
echo "📊 Check logs with: ssh -i $KEY_PATH ec2-user@$EC2_IP 'tail -f $DEPLOY_DIR/logs/app.log'"