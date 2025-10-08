#!/bin/bash
# WordMaster - Nginx SSL Setup Script with Let's Encrypt
# This script installs and configures Nginx as a reverse proxy with SSL/TLS

set -e  # Exit on any error

echo "=========================================="
echo "WordMaster Nginx SSL Setup"
echo "=========================================="
echo ""

# Configuration Variables - UPDATE THESE
DOMAIN_NAME="${1:-your-domain.com}"  # Pass domain as first argument or edit this
EMAIL="${2:-your-email@example.com}"  # Pass email as second argument or edit this
BACKEND_PORT="8080"

# Validate inputs
if [ "$DOMAIN_NAME" == "your-domain.com" ]; then
    echo "ERROR: Please provide your domain name as the first argument"
    echo "Usage: ./setup-nginx-ssl.sh yourdomain.com your-email@example.com"
    exit 1
fi

if [ "$EMAIL" == "your-email@example.com" ]; then
    echo "ERROR: Please provide your email as the second argument"
    echo "Usage: ./setup-nginx-ssl.sh yourdomain.com your-email@example.com"
    exit 1
fi

echo "Domain: $DOMAIN_NAME"
echo "Email: $EMAIL"
echo "Backend Port: $BACKEND_PORT"
echo ""

# Step 1: Update system
echo "Step 1: Updating system packages..."
sudo yum update -y

# Step 2: Install Nginx
echo ""
echo "Step 2: Installing Nginx..."
sudo amazon-linux-extras install nginx1 -y || sudo yum install nginx -y

# Step 3: Install Certbot for Let's Encrypt
echo ""
echo "Step 3: Installing Certbot (Let's Encrypt client)..."
sudo yum install -y certbot python3-certbot-nginx

# Step 4: Configure Nginx (initial HTTP configuration)
echo ""
echo "Step 4: Creating initial Nginx configuration..."
sudo tee /etc/nginx/conf.d/wordmaster.conf > /dev/null << EOF
# WordMaster Nginx Configuration (HTTP - will be upgraded to HTTPS)

server {
    listen 80;
    server_name $DOMAIN_NAME;

    # Increase body size for file uploads
    client_max_body_size 10M;

    # Logging
    access_log /var/log/nginx/wordmaster-access.log;
    error_log /var/log/nginx/wordmaster-error.log;

    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Proxy to Spring Boot application
    location / {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        
        # WebSocket support (if needed for future features)
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /actuator/health {
        proxy_pass http://localhost:$BACKEND_PORT/actuator/health;
        access_log off;
    }
}
EOF

# Step 5: Test Nginx configuration
echo ""
echo "Step 5: Testing Nginx configuration..."
sudo nginx -t

# Step 6: Start and enable Nginx
echo ""
echo "Step 6: Starting Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx --no-pager

# Step 7: Check if Spring Boot is running
echo ""
echo "Step 7: Checking if Spring Boot application is running..."
if curl -s http://localhost:$BACKEND_PORT/actuator/health > /dev/null 2>&1; then
    echo "✓ Spring Boot application is running on port $BACKEND_PORT"
else
    echo "⚠ WARNING: Spring Boot application is not running on port $BACKEND_PORT"
    echo "Please start your application before proceeding with SSL setup"
    echo "Run: sudo systemctl start wordmaster"
fi

# Step 8: Open firewall ports (if firewalld is active)
echo ""
echo "Step 8: Configuring firewall..."
if sudo systemctl is-active --quiet firewalld; then
    echo "Firewalld is active, opening ports..."
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --reload
    echo "✓ Ports 80 and 443 opened"
else
    echo "Firewalld is not active, skipping..."
fi

# Step 9: Important pre-SSL checks
echo ""
echo "=========================================="
echo "Pre-SSL Certificate Checks"
echo "=========================================="
echo ""
echo "Before obtaining SSL certificate, ensure:"
echo "1. ✓ DNS Record: Your domain '$DOMAIN_NAME' points to this server's IP"
echo "2. ✓ Security Group: Ports 80 and 443 are open in AWS Security Group"
echo "3. ✓ Application: Spring Boot is running on port $BACKEND_PORT"
echo ""
echo "Checking DNS resolution..."
CURRENT_IP=$(curl -s https://api.ipify.org)
DOMAIN_IP=$(dig +short $DOMAIN_NAME | tail -n1)

echo "Server IP: $CURRENT_IP"
echo "Domain resolves to: $DOMAIN_IP"

if [ "$CURRENT_IP" == "$DOMAIN_IP" ]; then
    echo "✓ DNS is correctly configured!"
    DNS_OK=true
else
    echo "⚠ WARNING: DNS mismatch! Please update your DNS records first."
    DNS_OK=false
fi

echo ""
read -p "Do you want to proceed with SSL certificate generation? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Setup paused. When ready, run:"
    echo "sudo certbot --nginx -d $DOMAIN_NAME --email $EMAIL --agree-tos --non-interactive"
    echo ""
    echo "Then restart Nginx: sudo systemctl restart nginx"
    exit 0
fi

# Step 10: Obtain SSL certificate with Let's Encrypt
echo ""
echo "Step 10: Obtaining SSL certificate from Let's Encrypt..."
echo "This may take a few minutes..."

sudo certbot --nginx -d $DOMAIN_NAME --email $EMAIL --agree-tos --non-interactive --redirect

# Step 11: Test SSL configuration
echo ""
echo "Step 11: Testing SSL configuration..."
sudo nginx -t

# Step 12: Restart Nginx with SSL
echo ""
echo "Step 12: Restarting Nginx..."
sudo systemctl restart nginx

# Step 13: Setup auto-renewal
echo ""
echo "Step 13: Setting up SSL certificate auto-renewal..."
echo "Testing renewal process..."
sudo certbot renew --dry-run

# Add renewal cron job
(sudo crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sudo crontab -

echo ""
echo "=========================================="
echo "✓ SSL Setup Complete!"
echo "=========================================="
echo ""
echo "Your application is now accessible at:"
echo "  https://$DOMAIN_NAME"
echo ""
echo "Certificate details:"
sudo certbot certificates
echo ""
echo "Next Steps:"
echo "1. Update frontend VITE_API_URL to: https://$DOMAIN_NAME"
echo "2. Update Azure AD redirect URI to: https://$DOMAIN_NAME/auth/oauth/callback"
echo "3. Test your endpoints: https://$DOMAIN_NAME/actuator/health"
echo ""
echo "Useful commands:"
echo "  - Check Nginx status: sudo systemctl status nginx"
echo "  - View Nginx logs: sudo tail -f /var/log/nginx/wordmaster-error.log"
echo "  - Renew certificate manually: sudo certbot renew"
echo "  - View certificates: sudo certbot certificates"
echo ""
