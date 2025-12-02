# 🚀 DigitalOcean Deployment Guide

Complete guide for deploying EduConnect backend and self-hosted Jitsi Meet on DigitalOcean.

## 📋 Prerequisites

1. **DigitalOcean Account**: Sign up at [digitalocean.com](https://www.digitalocean.com)
2. **Domain Name**: (Optional but recommended) A domain name for your application
3. **SSH Key**: Your SSH public key added to DigitalOcean

## 🖥️ Step 1: Create a Droplet

### Recommended Droplet Configuration

- **Image**: Ubuntu 22.04 LTS
- **Plan**: 
  - **Minimum**: 4GB RAM / 2 vCPUs (for testing)
  - **Recommended**: 8GB RAM / 4 vCPUs (for production with Jitsi)
  - **Optimal**: 16GB RAM / 8 vCPUs (for high traffic)
- **Datacenter**: Choose closest to your users
- **Authentication**: SSH keys (recommended) or password
- **Hostname**: `educonnect-server` (or your preferred name)

### Create Droplet via CLI

```bash
# Install doctl (DigitalOcean CLI)
# macOS
brew install doctl

# Linux
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
tar xf doctl-1.94.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# Authenticate
doctl auth init

# Create droplet
doctl compute droplet create educonnect-server \
  --image ubuntu-22-04-x64 \
  --size s-4vcpu-8gb \
  --region nyc1 \
  --ssh-keys YOUR_SSH_KEY_ID \
  --wait
```

## 🔧 Step 2: Initial Server Setup

### Connect to Your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### Update System

```bash
apt update && apt upgrade -y
```

### Create Non-Root User (Recommended)

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker compose version
```

### Install Additional Tools

```bash
sudo apt install -y git ufw fail2ban
```

### Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp  # Backend API
sudo ufw allow 8080/tcp  # Jitsi HTTP (if not using reverse proxy)
sudo ufw allow 8443/tcp  # Jitsi HTTPS (if not using reverse proxy)
sudo ufw allow 10000/udp # Jitsi JVB media
sudo ufw allow 4443/tcp  # Jitsi JVB TCP
sudo ufw enable
```

## 📦 Step 3: Clone and Configure Application

### Clone Repository

```bash
cd /opt
sudo git clone YOUR_REPOSITORY_URL educonnect
sudo chown -R $USER:$USER educonnect
cd educonnect
```

### Create Environment Files

```bash
# Backend environment
cp backend/env.example backend/.env
nano backend/.env

# Frontend environment
cp frontend/env.example frontend/.env.local
nano frontend/.env.local

# Root environment (for docker-compose)
cp .env.example .env
nano .env
```

### Configure Environment Variables

#### Backend `.env` (backend/.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb://admin:YOUR_PASSWORD@mongodb:27017/educonnect?authSource=admin

# JWT Configuration (Generate strong secrets!)
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
JWT_EXPIRE=30d
JWT_REFRESH_SECRET=your-refresh-token-secret-here-minimum-32-characters
JWT_REFRESH_EXPIRE=7d

# Security Configuration
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-here-minimum-32-characters
TRUST_PROXY=true

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Jitsi Configuration
JITSI_DOMAIN=meet.yourdomain.com
# OR for local testing without domain:
# JITSI_DOMAIN=YOUR_DROPLET_IP:8080
```

#### Frontend `.env.local` (frontend/.env.local)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
# OR for testing:
# NEXT_PUBLIC_API_URL=http://YOUR_DROPLET_IP:5000/api

NEXTAUTH_SECRET=your-nextauth-secret-here-minimum-32-characters
NEXTAUTH_URL=https://yourdomain.com
# OR for testing:
# NEXTAUTH_URL=http://YOUR_DROPLET_IP:3000

# Jitsi Configuration
NEXT_PUBLIC_JITSI_DOMAIN=meet.yourdomain.com
# OR for local testing without domain:
# NEXT_PUBLIC_JITSI_DOMAIN=YOUR_DROPLET_IP:8080
```

#### Root `.env` (for docker-compose)

```env
# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-mongodb-password
MONGO_DB_NAME=educonnect

# Secrets
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-token-secret-here-minimum-32-characters
NEXTAUTH_SECRET=your-nextauth-secret-here-minimum-32-characters

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXTAUTH_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Jitsi Configuration
JITSI_DOMAIN=meet.yourdomain.com
JITSI_PUBLIC_URL=https://meet.yourdomain.com
JITSI_XMPP_DOMAIN=meet.yourdomain.com
JITSI_XMPP_AUTH_DOMAIN=auth.meet.yourdomain.com
JITSI_XMPP_GUEST_DOMAIN=guest.meet.yourdomain.com
JITSI_XMPP_MUC_DOMAIN=conference.meet.yourdomain.com
JITSI_XMPP_INTERNAL_MUC_DOMAIN=internal.auth.meet.yourdomain.com
JITSI_XMPP_RECORDER_DOMAIN=recorder.meet.yourdomain.com
JITSI_XMPP_SERVER=jitsi-prosody
JITSI_XMPP_BOSH_URL_BASE=https://meet.yourdomain.com/http-bind

# Jitsi Authentication (Set to 0 for open access, 1 for authentication)
JITSI_ENABLE_AUTH=0
JITSI_ENABLE_GUESTS=1

# Jitsi Security Secrets (Generate with: openssl rand -hex 16)
JITSI_JICOFO_COMPONENT_SECRET=your-jicofo-component-secret
JITSI_JICOFO_AUTH_USER=focus
JITSI_JICOFO_AUTH_PASSWORD=your-jicofo-password
JITSI_JVB_AUTH_USER=jvb
JITSI_JVB_AUTH_PASSWORD=your-jvb-password
JITSI_JIGASI_XMPP_USER=jigasi
JITSI_JIGASI_XMPP_PASSWORD=your-jigasi-password
JITSI_JIBRI_XMPP_USER=jibri
JITSI_JIBRI_XMPP_PASSWORD=your-jibri-password
JITSI_JIBRI_RECORDER_USER=recorder
JITSI_JIBRI_RECORDER_PASSWORD=your-recorder-password

# Jitsi HTTPS/SSL
JITSI_ENABLE_LETSENCRYPT=1
JITSI_ENABLE_HTTP_REDIRECT=1
JITSI_ENABLE_HSTS=1
JITSI_DISABLE_HTTPS=0
JITSI_LETSENCRYPT_EMAIL=your-email@example.com

# Jitsi Ports
JITSI_WEB_PORT=8443
JITSI_WEB_HTTP_PORT=8080
JITSI_JVB_PORT=10000
JITSI_JVB_TCP_PORT=4443

# Jitsi Docker Host Address (CRITICAL - Set to your droplet's public IP)
JITSI_DOCKER_HOST_ADDRESS=YOUR_DROPLET_IP

# Jitsi Features
JITSI_ENABLE_RECORDING=0
JITSI_ENABLE_FILE_RECORDING_SERVICE=0
JITSI_ENABLE_LIVE_STREAMING=0
JITSI_ENABLE_XMPP_WEBSOCKET=1
JITSI_ENABLE_LOBBY=0

# Timezone
TZ=UTC
```

### Generate Strong Secrets

```bash
# Generate JWT secrets
openssl rand -hex 32

# Generate Jitsi passwords
openssl rand -hex 16
```

## 🌐 Step 4: Domain Configuration (Optional but Recommended)

### Point Domain to Droplet

1. **Add A Record** in your DNS:
   - `@` → `YOUR_DROPLET_IP`
   - `api` → `YOUR_DROPLET_IP`
   - `meet` → `YOUR_DROPLET_IP` (for Jitsi)

2. **Wait for DNS Propagation** (can take up to 48 hours, usually 5-15 minutes)

### Verify DNS

```bash
dig yourdomain.com
dig api.yourdomain.com
dig meet.yourdomain.com
```

## 🚀 Step 5: Deploy Application

### Build and Start Services

```bash
cd /opt/educonnect

# Build all services
docker compose build

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Verify Services

```bash
# Check backend health
curl http://localhost:5000/health

# Check frontend
curl http://localhost:3000

# Check Jitsi
curl http://localhost:8080
```

## 🔒 Step 6: Configure Nginx (Optional - Recommended for Production)

### Install Nginx

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/educonnect
```

Add configuration:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Jitsi Meet
server {
    listen 80;
    server_name meet.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable Site and Get SSL Certificates

```bash
sudo ln -s /etc/nginx/sites-available/educonnect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com -d meet.yourdomain.com
```

## ✅ Step 7: Verify Deployment

### Test Backend

```bash
curl https://api.yourdomain.com/health
```

### Test Frontend

Open in browser: `https://yourdomain.com`

### Test Jitsi

1. Open: `https://meet.yourdomain.com`
2. Create a test room
3. Verify video/audio works

### Test Room ID Generation

1. Create a booking in the app
2. Accept the booking (as teacher)
3. Verify unique room ID is generated: `educonnect-{gigTitleSlug}-{bookingId}-{random16}`
4. Join the meeting and verify it works

## 🔄 Step 8: Maintenance Commands

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f jitsi-web
docker compose logs -f jitsi-jvb
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
```

### Update Application

```bash
cd /opt/educonnect
git pull
docker compose build
docker compose up -d
```

### Backup MongoDB

```bash
# Create backup
docker exec educonnect-mongodb mongodump --out /data/backup

# Restore backup
docker exec -i educonnect-mongodb mongorestore /data/backup
```

## 🐛 Troubleshooting

### Jitsi Not Working

1. **Check JVB logs**:
   ```bash
   docker compose logs jitsi-jvb
   ```

2. **Verify DOCKER_HOST_ADDRESS**:
   ```bash
   # Get your droplet's public IP
   curl ifconfig.me
   # Update JITSI_DOCKER_HOST_ADDRESS in .env
   ```

3. **Check firewall**:
   ```bash
   sudo ufw status
   sudo ufw allow 10000/udp
   ```

4. **Check ports**:
   ```bash
   sudo netstat -tulpn | grep 10000
   ```

### Backend Not Starting

1. **Check logs**:
   ```bash
   docker compose logs backend
   ```

2. **Verify MongoDB connection**:
   ```bash
   docker compose exec mongodb mongosh -u admin -p
   ```

3. **Check environment variables**:
   ```bash
   docker compose exec backend env | grep MONGODB
   ```

### Frontend Build Errors

1. **Check build logs**:
   ```bash
   docker compose logs frontend
   ```

2. **Rebuild**:
   ```bash
   docker compose build --no-cache frontend
   docker compose up -d frontend
   ```

## 📊 Monitoring

### Resource Usage

```bash
# Docker stats
docker stats

# System resources
htop
df -h
```

### Set Up Monitoring (Optional)

Consider using:
- **DigitalOcean Monitoring**: Built-in monitoring dashboard
- **Uptime Robot**: External uptime monitoring
- **Sentry**: Error tracking (already configured in backend)

## 🔐 Security Best Practices

1. **Keep system updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use strong passwords** for all services

3. **Enable fail2ban**:
   ```bash
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

4. **Regular backups**:
   - Set up automated MongoDB backups
   - Backup environment files securely

5. **Monitor logs** regularly

6. **Keep Docker images updated**:
   ```bash
   docker compose pull
   docker compose up -d
   ```

## 📝 Next Steps

1. ✅ Set up automated backups
2. ✅ Configure monitoring alerts
3. ✅ Set up CI/CD pipeline
4. ✅ Configure CDN for static assets
5. ✅ Set up Redis for session storage (optional)
6. ✅ Configure email notifications

## 🆘 Support

If you encounter issues:

1. Check logs: `docker compose logs`
2. Review this guide
3. Check [DigitalOcean Documentation](https://docs.digitalocean.com/)
4. Check [Jitsi Documentation](https://jitsi.github.io/handbook/)

---

**Congratulations! Your EduConnect application is now deployed on DigitalOcean with self-hosted Jitsi Meet! 🎉**

