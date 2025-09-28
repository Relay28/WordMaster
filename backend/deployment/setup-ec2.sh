#!/bin/bash
# WordMaster EC2 Setup Script
# Run this after connecting to your EC2 instance

echo "Starting WordMaster EC2 setup..."

# Update system
sudo yum update -y

# Install Java 21
sudo yum install -y java-21-amazon-corretto-devel

# Install Python 3.11 and pip
sudo yum install -y python3.11 python3.11-pip

# Install Git
sudo yum install -y git

# Create application directory
sudo mkdir -p /opt/wordmaster
sudo mkdir -p /opt/wordmaster/logs
sudo chown -R ec2-user:ec2-user /opt/wordmaster

# Create systemd service for Spring Boot
sudo tee /etc/systemd/system/wordmaster.service > /dev/null << 'EOF'
[Unit]
Description=WordMaster Spring Boot Application
After=network.target

[Service]
Type=forking
User=ec2-user
WorkingDirectory=/opt/wordmaster
ExecStart=/bin/bash -c 'source /opt/wordmaster/env.sh && java $JAVA_OPTS -jar wordmaster.jar > /opt/wordmaster/logs/app.log 2>&1 &'
ExecStop=/bin/kill -TERM $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for Python GecTor
sudo tee /etc/systemd/system/gector.service > /dev/null << 'EOF'
[Unit]
Description=GecTor Python Grammar Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/wordmaster/python-services
ExecStart=/usr/bin/python3.11 gector_service.py
Restart=always
RestartSec=10
Environment=PYTHONPATH=/opt/wordmaster/python-services

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

echo "EC2 setup completed!"
echo "Next steps:"
echo "1. Upload your JAR file to /opt/wordmaster/"
echo "2. Upload python-services directory to /opt/wordmaster/"
echo "3. Configure environment variables in /opt/wordmaster/env.sh"
echo "4. Install Python dependencies"
echo "5. Start services"