#!/bin/bash
# Pre-flight Checklist for SSL Setup
# Run this BEFORE attempting SSL setup to ensure prerequisites are met

echo "=========================================="
echo "WordMaster SSL Pre-flight Checklist"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Get inputs
echo "Please provide the following information:"
echo ""
read -p "Domain name (e.g., api.wordmaster.com): " DOMAIN
read -p "Email address: " EMAIL

echo ""
echo "Starting pre-flight checks..."
echo ""

# Check 1: Internet connectivity
echo -n "1. Internet connectivity... "
if curl -s --max-time 5 https://google.com > /dev/null; then
    echo -e "${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC}"
    echo "   Error: No internet connection"
    ((CHECKS_FAILED++))
fi

# Check 2: Domain provided
echo -n "2. Domain name provided... "
if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "" ]; then
    echo -e "${GREEN}✓${NC} ($DOMAIN)"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC}"
    echo "   Error: Domain name is required"
    ((CHECKS_FAILED++))
fi

# Check 3: Email provided
echo -n "3. Email address provided... "
if [ -n "$EMAIL" ] && [[ "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo -e "${GREEN}✓${NC} ($EMAIL)"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC}"
    echo "   Error: Valid email address is required"
    ((CHECKS_FAILED++))
fi

# Check 4: DNS Resolution
echo -n "4. DNS resolution... "
DOMAIN_IP=$(dig +short $DOMAIN 2>/dev/null | tail -n1)
SERVER_IP=$(curl -s https://api.ipify.org)

if [ -n "$DOMAIN_IP" ]; then
    if [ "$DOMAIN_IP" == "$SERVER_IP" ]; then
        echo -e "${GREEN}✓${NC}"
        echo "   Domain $DOMAIN → $DOMAIN_IP (matches server IP)"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}⚠${NC}"
        echo "   Warning: Domain resolves to $DOMAIN_IP but server is $SERVER_IP"
        echo "   You need to update your DNS A record"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗${NC}"
    echo "   Error: Domain $DOMAIN does not resolve to any IP"
    echo "   Action: Create DNS A record pointing to $SERVER_IP"
    ((CHECKS_FAILED++))
fi

# Check 5: Port 80 availability
echo -n "5. Port 80 available... "
if ! sudo lsof -i :80 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC}"
    echo "   Warning: Port 80 is already in use"
    echo "   Process using port 80:"
    sudo lsof -i :80 | sed 's/^/   /'
    ((WARNINGS++))
fi

# Check 6: Port 443 availability
echo -n "6. Port 443 available... "
if ! sudo lsof -i :443 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC}"
    echo "   Warning: Port 443 is already in use"
    ((WARNINGS++))
fi

# Check 7: Spring Boot running
echo -n "7. Spring Boot application... "
if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    echo "   Application is running on port 8080"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC}"
    echo "   Error: Spring Boot is not running on port 8080"
    echo "   Action: sudo systemctl start wordmaster"
    ((CHECKS_FAILED++))
fi

# Check 8: Root/sudo access
echo -n "8. Sudo privileges... "
if sudo -n true 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC}"
    echo "   You may need to enter password for sudo commands"
    ((WARNINGS++))
fi

# Check 9: Disk space
echo -n "9. Disk space... "
AVAILABLE=$(df / | tail -1 | awk '{print $4}')
if [ $AVAILABLE -gt 1000000 ]; then  # More than 1GB
    echo -e "${GREEN}✓${NC}"
    echo "   $(df -h / | tail -1 | awk '{print $4}') available"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC}"
    echo "   Warning: Low disk space"
    ((WARNINGS++))
fi

# Check 10: Required commands
echo -n "10. Required commands... "
MISSING_COMMANDS=()
for cmd in curl dig nc; do
    if ! command -v $cmd &> /dev/null; then
        MISSING_COMMANDS+=($cmd)
    fi
done

if [ ${#MISSING_COMMANDS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC}"
    echo "   Warning: Missing commands: ${MISSING_COMMANDS[*]}"
    echo "   Install: sudo yum install -y bind-utils nc"
    ((WARNINGS++))
fi

# Summary
echo ""
echo "=========================================="
echo "Pre-flight Check Summary"
echo "=========================================="
echo ""
echo -e "Passed:   ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Failed:   ${RED}$CHECKS_FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

# Decision
if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed!${NC}"
        echo ""
        echo "You are ready to proceed with SSL setup."
        echo ""
        echo -e "${BLUE}Next step:${NC}"
        echo "  ./setup-nginx-ssl.sh $DOMAIN $EMAIL"
        echo ""
        
        # Offer to continue
        read -p "Would you like to proceed with SSL setup now? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Starting SSL setup..."
            ./setup-nginx-ssl.sh "$DOMAIN" "$EMAIL"
        else
            echo "Setup cancelled. Run the command above when ready."
        fi
    else
        echo -e "${YELLOW}⚠ Checks passed with warnings${NC}"
        echo ""
        echo "You can proceed, but please address the warnings above."
        echo ""
        echo -e "${BLUE}To proceed anyway:${NC}"
        echo "  ./setup-nginx-ssl.sh $DOMAIN $EMAIL"
        echo ""
    fi
else
    echo -e "${RED}✗ Pre-flight checks failed${NC}"
    echo ""
    echo "Please fix the errors above before proceeding with SSL setup."
    echo ""
    
    # Provide specific actions
    echo -e "${BLUE}Action items:${NC}"
    if [[ $DOMAIN_IP != $SERVER_IP ]]; then
        echo "  1. Update DNS A record for $DOMAIN to point to $SERVER_IP"
    fi
    if ! curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo "  2. Start Spring Boot: sudo systemctl start wordmaster"
    fi
    echo ""
    echo "After fixing, run this checklist again:"
    echo "  ./preflight-check.sh"
    echo ""
    exit 1
fi
