#!/bin/bash
# WordMaster SSL Troubleshooting Script
# Run this to diagnose common SSL/HTTPS issues

echo "=========================================="
echo "WordMaster SSL Diagnostic Tool"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get domain from argument or prompt
DOMAIN="${1}"
if [ -z "$DOMAIN" ]; then
    read -p "Enter your domain name: " DOMAIN
fi

echo "Checking domain: $DOMAIN"
echo ""

# Check 1: Server IP
echo "1. Checking server IP..."
SERVER_IP=$(curl -s https://api.ipify.org)
echo "   Server IP: $SERVER_IP"

# Check 2: DNS Resolution
echo ""
echo "2. Checking DNS resolution..."
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
if [ -z "$DOMAIN_IP" ]; then
    echo -e "   ${RED}✗ DNS not configured${NC}"
    echo "   Action: Add A record for $DOMAIN pointing to $SERVER_IP"
else
    echo "   Domain resolves to: $DOMAIN_IP"
    if [ "$SERVER_IP" == "$DOMAIN_IP" ]; then
        echo -e "   ${GREEN}✓ DNS correctly configured${NC}"
    else
        echo -e "   ${YELLOW}⚠ DNS mismatch${NC}"
        echo "   Action: Update DNS A record to point to $SERVER_IP"
    fi
fi

# Check 3: Ports
echo ""
echo "3. Checking ports..."
if nc -zv localhost 80 2>&1 | grep -q succeeded; then
    echo -e "   ${GREEN}✓ Port 80 (HTTP) is open${NC}"
else
    echo -e "   ${RED}✗ Port 80 (HTTP) is closed${NC}"
    echo "   Action: Check Nginx status and firewall"
fi

if nc -zv localhost 443 2>&1 | grep -q succeeded; then
    echo -e "   ${GREEN}✓ Port 443 (HTTPS) is open${NC}"
else
    echo -e "   ${YELLOW}⚠ Port 443 (HTTPS) is closed${NC}"
    echo "   Action: SSL may not be configured yet"
fi

if nc -zv localhost 8080 2>&1 | grep -q succeeded; then
    echo -e "   ${GREEN}✓ Port 8080 (Spring Boot) is open${NC}"
else
    echo -e "   ${RED}✗ Port 8080 (Spring Boot) is closed${NC}"
    echo "   Action: Start Spring Boot application"
fi

# Check 4: Services
echo ""
echo "4. Checking services..."

# Check Nginx
if sudo systemctl is-active --quiet nginx; then
    echo -e "   ${GREEN}✓ Nginx is running${NC}"
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
    echo "     Version: $NGINX_VERSION"
else
    echo -e "   ${RED}✗ Nginx is not running${NC}"
    echo "   Action: sudo systemctl start nginx"
fi

# Check WordMaster
if sudo systemctl is-active --quiet wordmaster; then
    echo -e "   ${GREEN}✓ WordMaster is running${NC}"
else
    echo -e "   ${RED}✗ WordMaster is not running${NC}"
    echo "   Action: sudo systemctl start wordmaster"
fi

# Check 5: Spring Boot Health
echo ""
echo "5. Checking Spring Boot application..."
if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:8080/actuator/health)
    echo -e "   ${GREEN}✓ Application is responding${NC}"
    echo "   Health: $HEALTH"
else
    echo -e "   ${RED}✗ Application is not responding${NC}"
    echo "   Action: Check application logs"
fi

# Check 6: HTTP Access
echo ""
echo "6. Checking HTTP access..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN 2>/dev/null || echo "000")
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "301" ] || [ "$HTTP_CODE" == "302" ]; then
    echo -e "   ${GREEN}✓ HTTP accessible (Status: $HTTP_CODE)${NC}"
else
    echo -e "   ${YELLOW}⚠ HTTP not accessible (Status: $HTTP_CODE)${NC}"
    echo "   Action: Check Nginx configuration and AWS Security Group"
fi

# Check 7: HTTPS Access
echo ""
echo "7. Checking HTTPS access..."
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null || echo "000")
if [ "$HTTPS_CODE" == "200" ]; then
    echo -e "   ${GREEN}✓ HTTPS accessible (Status: $HTTPS_CODE)${NC}"
else
    echo -e "   ${YELLOW}⚠ HTTPS not accessible (Status: $HTTPS_CODE)${NC}"
    echo "   Action: Run SSL setup script or check certificate"
fi

# Check 8: SSL Certificate
echo ""
echo "8. Checking SSL certificate..."
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo -e "   ${GREEN}✓ Certificate exists for $DOMAIN${NC}"
    CERT_EXPIRY=$(sudo certbot certificates 2>/dev/null | grep "Expiry Date" | head -1 | cut -d':' -f2-)
    echo "   Expiry:$CERT_EXPIRY"
else
    echo -e "   ${YELLOW}⚠ No certificate found${NC}"
    echo "   Action: Run: sudo certbot --nginx -d $DOMAIN"
fi

# Check 9: Nginx Configuration
echo ""
echo "9. Checking Nginx configuration..."
if sudo nginx -t > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "   ${RED}✗ Nginx configuration has errors${NC}"
    echo "   Details:"
    sudo nginx -t 2>&1 | sed 's/^/     /'
fi

# Check 10: Logs
echo ""
echo "10. Recent errors in logs..."
echo ""
echo "Nginx Error Log (last 5 lines):"
sudo tail -5 /var/log/nginx/wordmaster-error.log 2>/dev/null || echo "   No errors"
echo ""
echo "Spring Boot Log (last 5 lines):"
sudo journalctl -u wordmaster -n 5 --no-pager 2>/dev/null || echo "   No logs available"

# Summary
echo ""
echo "=========================================="
echo "Summary & Recommendations"
echo "=========================================="
echo ""

# Build recommendation list
ACTIONS=()

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    ACTIONS+=("Update DNS A record to point to $SERVER_IP")
fi

if ! sudo systemctl is-active --quiet nginx; then
    ACTIONS+=("Start Nginx: sudo systemctl start nginx")
fi

if ! sudo systemctl is-active --quiet wordmaster; then
    ACTIONS+=("Start WordMaster: sudo systemctl start wordmaster")
fi

if [ "$HTTPS_CODE" != "200" ] && [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    ACTIONS+=("Install SSL certificate: ./setup-nginx-ssl.sh $DOMAIN your-email@example.com")
fi

if [ ${#ACTIONS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Your setup looks good.${NC}"
    echo ""
    echo "Test your endpoints:"
    echo "  - https://$DOMAIN/actuator/health"
    echo "  - https://$DOMAIN/api/auth/login"
else
    echo -e "${YELLOW}Actions needed:${NC}"
    for i in "${!ACTIONS[@]}"; do
        echo "$((i+1)). ${ACTIONS[$i]}"
    done
fi

echo ""
echo "For detailed logs:"
echo "  - Nginx errors: sudo tail -f /var/log/nginx/wordmaster-error.log"
echo "  - Application logs: sudo journalctl -u wordmaster -f"
echo ""
