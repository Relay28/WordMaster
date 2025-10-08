# WordMaster Backend Deployment

This folder contains scripts and configuration files for deploying the WordMaster backend to AWS EC2 with HTTPS/SSL support.

## 📁 Files Overview

### SSL/HTTPS Setup (New!)
- **`setup-nginx-ssl.sh`** - Automated script to install Nginx, configure reverse proxy, and set up Let's Encrypt SSL
- **`SSL-SETUP-GUIDE.md`** - Complete step-by-step guide for HTTPS setup
- **`QUICK-SSL-REFERENCE.md`** - Quick command reference card
- **`diagnose-ssl.sh`** - Troubleshooting tool for SSL/HTTPS issues

### Deployment Scripts
- **`setup-ec2.sh`** - Initial EC2 instance setup (Java, Python, systemd services)
- **`build.bat`** - Build script for Windows
- **`deploy.sh`** - Deployment script for Linux/Mac
- **`test-deployment.sh`** - Test deployment endpoints

### Configuration
- **`env.sh.template`** - Environment variables template
- **`env.sh`** - Actual environment variables (not in git, create from template)
- **`wordmasterec2key.pem`** - EC2 SSH private key (keep secure!)

### Build Output
- **`build/`** - Contains built artifacts ready for deployment
  - `wordmaster.jar` - Spring Boot application
  - `python-services/` - Python microservices
  - `run-app.sh` - Application startup script

## 🚀 Quick Start

### Option 1: HTTPS with SSL (Recommended for Production)

**Prerequisites:**
- Domain name pointing to your EC2 IP
- EC2 Security Group with ports 80 and 443 open
- Email address for Let's Encrypt

**Steps:**
1. Read the complete guide: [`SSL-SETUP-GUIDE.md`](./SSL-SETUP-GUIDE.md)
2. Or use the quick reference: [`QUICK-SSL-REFERENCE.md`](./QUICK-SSL-REFERENCE.md)

**Quick command:**
```bash
# Upload and run SSL setup
chmod +x setup-nginx-ssl.sh
./setup-nginx-ssl.sh your-domain.com your-email@example.com
```

### Option 2: HTTP Only (Development/Testing)

**Steps:**
1. Initial EC2 setup:
```bash
chmod +x setup-ec2.sh
./setup-ec2.sh
```

2. Create environment file:
```bash
cp env.sh.template env.sh
nano env.sh  # Edit with your values
```

3. Deploy application:
```bash
# Upload JAR and Python services to /opt/wordmaster/
sudo systemctl start wordmaster
sudo systemctl start gector
```

## 🔧 Troubleshooting

If you encounter issues with SSL/HTTPS:

```bash
# Run diagnostic script
chmod +x diagnose-ssl.sh
./diagnose-ssl.sh your-domain.com
```

This will check:
- DNS configuration
- Port availability
- Service status
- SSL certificate
- Application health
- Recent error logs

## 📝 Configuration Checklist

### Backend (EC2)
- [ ] EC2 instance running Amazon Linux 2
- [ ] Java 21 installed
- [ ] Python 3.11 installed
- [ ] MySQL/RDS configured
- [ ] Security Group: Ports 22, 80, 443 open
- [ ] Domain name pointing to EC2 IP
- [ ] SSL certificate installed
- [ ] Services running (wordmaster, nginx, gector)

### Frontend (Vercel)
- [ ] Environment variable `VITE_API_URL` set to `https://your-domain.com`
- [ ] Deployed to production
- [ ] No Mixed Content errors

### Azure AD
- [ ] Redirect URI updated to HTTPS
- [ ] Client secrets valid
- [ ] OAuth flow tested

## 🔐 Security Notes

### Private Key Protection
The `keyname.pem` file is your EC2 SSH private key. Keep it secure:

**Windows:**
```powershell
icacls "keyname.pem" /inheritance:r
icacls "keyname.pem" /grant:r "$($env:USERNAME):F"
```

**Linux/Mac:**
```bash
chmod 400 keyname.pem
```

### Environment Variables
Never commit `env.sh` with actual credentials. Use `env.sh.template` for reference.

### SSL Certificate
- Automatically renews every 60 days
- Monitor expiry: `sudo certbot certificates`
- Manual renewal: `sudo certbot renew`

## 📊 Service Management

### Spring Boot Application
```bash
# Status
sudo systemctl status wordmaster

# Start/Stop/Restart
sudo systemctl start wordmaster
sudo systemctl stop wordmaster
sudo systemctl restart wordmaster

# Logs
sudo journalctl -u wordmaster -f
```

### Nginx
```bash
# Status
sudo systemctl status nginx

# Start/Stop/Restart
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx

# Logs
sudo tail -f /var/log/nginx/wordmaster-access.log
sudo tail -f /var/log/nginx/wordmaster-error.log

# Test configuration
sudo nginx -t
```

### Python Services
```bash
# GecTor Service
sudo systemctl status gector
sudo systemctl restart gector
```

## 🧪 Testing Endpoints

### Health Check
```bash
# Local (on EC2)
curl http://localhost:8080/actuator/health

# Through Nginx (HTTP)
curl http://your-domain.com/actuator/health

# Through Nginx (HTTPS)
curl https://your-domain.com/actuator/health
```

### API Endpoints
```bash
# Login endpoint
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 📁 Deployment Structure on EC2

```
/opt/wordmaster/
├── wordmaster.jar              # Spring Boot application
├── env.sh                      # Environment variables
├── run-app.sh                  # Startup script
├── logs/
│   └── app.log                # Application logs
└── python-services/
    ├── gector_service.py      # Grammar checking service
    ├── requirements.txt
    └── start.sh

/etc/nginx/conf.d/
└── wordmaster.conf            # Nginx configuration

/etc/letsencrypt/live/your-domain.com/
├── fullchain.pem              # SSL certificate
└── privkey.pem                # Private key
```

## 🔄 Update Workflow

When deploying updates:

1. Build locally:
```bash
cd backend/wrdmstr
./mvnw clean package
```

2. Upload to EC2:
```bash
scp -i keyname.pem target/wrdmstr-*.jar ec2-user@your-domain.com:/opt/wordmaster/wordmaster.jar
```

3. Restart service:
```bash
ssh -i keyname.pem ec2-user@your-domain.com
sudo systemctl restart wordmaster
```

## 📞 Support & Resources

- **SSL Setup Guide**: [`SSL-SETUP-GUIDE.md`](./SSL-SETUP-GUIDE.md)
- **Quick Reference**: [`QUICK-SSL-REFERENCE.md`](./QUICK-SSL-REFERENCE.md)
- **Troubleshooting**: Run `./diagnose-ssl.sh`

### External Resources
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [AWS EC2 Security Groups](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security-groups.html)

---

**Last Updated**: October 2025  
**Version**: 2.0 (with SSL/HTTPS support)
