# WordMaster - SSL/HTTPS Setup Guide

## 🎯 Overview
This guide will help you set up HTTPS for your WordMaster backend using Nginx as a reverse proxy with Let's Encrypt SSL certificates.

---

## 📋 Prerequisites

### 1. **Domain Name** (Required)
You need a domain name pointing to your EC2 instance. Options:

- **Option A: Use your own domain** (e.g., `api.wordmaster.com`)
  - If you have a domain, create an A record pointing to your EC2 IP: `3.26.165.228`
  
- **Option B: Get a free domain**
  - [Freenom](https://www.freenom.com/) - Free domains (.tk, .ml, .ga, .cf, .gq)
  - [DuckDNS](https://www.duckdns.org/) - Free subdomain (e.g., `wordmaster.duckdns.org`)
  - [No-IP](https://www.noip.com/) - Free hostname

### 2. **EC2 Security Group Configuration**
Ensure your EC2 Security Group allows these ports:

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22 | TCP | Your IP | SSH access |
| 80 | TCP | 0.0.0.0/0 | HTTP (needed for SSL verification) |
| 443 | TCP | 0.0.0.0/0 | HTTPS (secure traffic) |
| 8080 | TCP | Localhost only | Spring Boot (internal) |

**To update Security Group:**
1. Go to AWS Console → EC2 → Security Groups
2. Select your instance's security group
3. Edit Inbound Rules
4. Add rules for ports 80 and 443 if not present

### 3. **Email Address**
You need an email for Let's Encrypt certificate notifications.

### 4. **DNS Configuration**
Point your domain to your EC2 IP address:
- **Type:** A Record
- **Name:** @ (or your subdomain like `api`)
- **Value:** `3.26.165.228`
- **TTL:** 3600 (or default)

---

## 🚀 Step-by-Step Setup Process

### **Step 1: Connect to Your EC2 Instance**

From your local machine (PowerShell):

```powershell
# Fix PEM file permissions (already done)
icacls "directory where you stored your .PEM key" /grant:r "$($env:USERNAME):F"

# Connect to EC2
ssh -i "directory where you stored your .PEM key" ec2-user@3.26.165.228
```

---

### **Step 2: Verify Your Application is Running**

Once connected to EC2:

```bash
# Check if Spring Boot is running
curl http://localhost:8080/actuator/health

# If not running, start it
sudo systemctl start wordmaster
sudo systemctl status wordmaster
```

---

### **Step 3: Upload the SSL Setup Script**

**From your local machine** (open a new PowerShell window):

```powershell
# Navigate to deployment folder
cd C:\temp\wrdmstr\WordMaster\backend\deployment

# Upload the SSL setup script to EC2
scp -i wordmasterec2key.pem setup-nginx-ssl.sh ec2-user@3.26.165.228:/home/ec2-user/
```

---

### **Step 4: Run the SSL Setup Script**

**Back on your EC2 instance (SSH session):**

```bash
# Make the script executable
chmod +x setup-nginx-ssl.sh

# Run the script with your domain and email
./setup-nginx-ssl.sh your-domain.com your-email@example.com

# Example:
# ./setup-nginx-ssl.sh api.wordmaster.com admin@wordmaster.com
```

**What the script does:**
1. ✅ Installs Nginx
2. ✅ Installs Certbot (Let's Encrypt client)
3. ✅ Configures Nginx as reverse proxy
4. ✅ Checks DNS configuration
5. ✅ Obtains SSL certificate
6. ✅ Configures HTTPS with auto-redirect
7. ✅ Sets up automatic certificate renewal

---

### **Step 5: Verify SSL is Working**

```bash
# Test SSL configuration
curl https://your-domain.com/actuator/health

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/wordmaster-error.log
```

**From your browser:**
- Visit: `https://your-domain.com/actuator/health`
- You should see a lock icon 🔒 in the address bar

---

### **Step 6: Update Backend Configuration**

The backend needs to know it's behind a reverse proxy. The configuration is mostly ready, but verify:

```bash
# Edit production properties on EC2
nano /opt/wordmaster/env.sh
```

Add if not present:
```bash
export JAVA_OPTS="-Dspring.profiles.active=prod -Dserver.forward-headers-strategy=framework"
```

Restart the application:
```bash
sudo systemctl restart wordmaster
```

---

### **Step 7: Update Frontend Configuration**

**On your local machine:**

1. **Update `.env.production` file:**

```env
# Replace with your HTTPS domain
VITE_API_URL=https://your-domain.com
```

2. **Update Vercel Environment Variables:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your `wordmaster` project
   - Go to **Settings** → **Environment Variables**
   - Add/Update:
     - **Key:** `VITE_API_URL`
     - **Value:** `https://your-domain.com`
     - **Environment:** Production
   - Click **Save**

3. **Redeploy frontend:**
```bash
cd frontend/wordmaster
git add .
git commit -m "Update API URL to HTTPS"
git push origin main
```

Vercel will automatically redeploy with the new environment variable.

---

### **Step 8: Update Azure AD Redirect URI**

Your OAuth redirect URI needs to use HTTPS:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App Registrations**
3. Select your WordMaster app
4. Go to **Authentication**
5. Under **Redirect URIs**, update to:
   ```
   https://wordmaster-nu.vercel.app/auth/oauth/callback
   ```
6. Click **Save**

---

## ✅ Testing Checklist

After setup, test these endpoints:

- [ ] `https://your-domain.com/actuator/health` - Should return `{"status":"UP"}`
- [ ] `https://your-domain.com/api/auth/login` - Should accept POST requests
- [ ] Frontend login - Should work without Mixed Content errors
- [ ] Check browser console - No SSL/HTTPS errors

---

## 🔧 Troubleshooting

### **Problem: DNS not resolving**
```bash
# Check DNS
dig your-domain.com

# Compare with server IP
curl https://api.ipify.org
```
**Solution:** Wait for DNS propagation (can take up to 48 hours, usually <1 hour)

### **Problem: Certbot fails**
```bash
# Check Nginx is running
sudo systemctl status nginx

# Check port 80 is accessible
curl http://your-domain.com

# Manual certificate request
sudo certbot --nginx -d your-domain.com --email your-email@example.com
```

### **Problem: 502 Bad Gateway**
```bash
# Check Spring Boot is running
curl http://localhost:8080/actuator/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/wordmaster-error.log

# Restart services
sudo systemctl restart wordmaster
sudo systemctl restart nginx
```

### **Problem: Mixed Content still appearing**
- Clear browser cache
- Check Vercel environment variables are set
- Verify frontend is using HTTPS URL
- Check Network tab in browser DevTools

---

## 🔄 Certificate Renewal

Certificates are valid for 90 days and auto-renew via cron job.

**Manual renewal:**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

**Check certificate expiry:**
```bash
sudo certbot certificates
```

---

## 📊 Monitoring & Logs

### **Nginx Logs**
```bash
# Access logs
sudo tail -f /var/log/nginx/wordmaster-access.log

# Error logs
sudo tail -f /var/log/nginx/wordmaster-error.log
```

### **Spring Boot Logs**
```bash
sudo journalctl -u wordmaster -f
```

### **Certificate Logs**
```bash
sudo cat /var/log/letsencrypt/letsencrypt.log
```

---

## 🎉 Success!

Your WordMaster application should now be:
- ✅ Accessible via HTTPS
- ✅ Secured with SSL/TLS certificate
- ✅ Auto-renewing certificates
- ✅ No Mixed Content errors on frontend
- ✅ Ready for production use

---

## 📞 Need Help?

If you encounter issues, check:
1. EC2 Security Group settings
2. DNS configuration
3. Application logs
4. Nginx configuration: `/etc/nginx/conf.d/wordmaster.conf`

---

## 🔗 Useful Links

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Documentation](https://certbot.eff.org/)
- [Nginx Reverse Proxy Guide](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [AWS Security Groups](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security-groups.html)
