# 🚀 Quick Deploy to DigitalOcean - Simple Guide

This is a **simple, step-by-step guide** to deploy your EduConnect backend on DigitalOcean in **15 minutes**.

---

## 📋 Prerequisites

- DigitalOcean account ([Sign up here](https://www.digitalocean.com))
- Domain name (optional, but recommended)
- Basic terminal/SSH knowledge

---

## 🎯 Step 1: Create Droplet (5 minutes)

### Option A: Via DigitalOcean Dashboard

1. **Login** to [DigitalOcean](https://cloud.digitalocean.com)
2. Click **"Create"** → **"Droplets"**
3. **Choose**:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: **8GB RAM / 4 vCPUs** (minimum for Jitsi)
   - **Datacenter**: Choose closest to your users
   - **Authentication**: SSH keys (recommended) or password
4. Click **"Create Droplet"**
5. **Wait** 1-2 minutes for droplet to be ready
6. **Copy** your droplet's IP address

### Option B: Via Command Line

```bash
# Install doctl (DigitalOcean CLI)
# macOS: brew install doctl
# Linux: Download from https://github.com/digitalocean/doctl/releases

# Authenticate
doctl auth init

# Create droplet
doctl compute droplet create educonnect \
  --image ubuntu-22-04-x64 \
  --size s-4vcpu-8gb \
  --region nyc1 \
  --ssh-keys YOUR_SSH_KEY_ID \
  --wait
```

---

## 🔧 Step 2: Connect to Your Server (1 minute)

```bash
# Replace YOUR_DROPLET_IP with your actual IP
ssh root@YOUR_DROPLET_IP

# Or if using a non-root user
ssh deploy@YOUR_DROPLET_IP
```

---

## 🐳 Step 3: Install Docker (2 minutes)

Copy and paste these commands one by one:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add current user to docker group (if not root)
usermod -aG docker $USER
newgrp docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker compose version
```

---

## 🔥 Step 4: Configure Firewall (1 minute)

```bash
# Allow required ports
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5000/tcp    # Backend
ufw allow 8080/tcp    # Jitsi HTTP
ufw allow 10000/udp   # Jitsi media
ufw enable
```

---

## 📦 Step 5: Clone Your Project (2 minutes)

```bash
# Navigate to a good location
cd /opt

# Clone your repository (replace with your repo URL)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git educonnect
cd educonnect

# Or upload files via SCP if private repo
# scp -r /path/to/project root@YOUR_DROPLET_IP:/opt/educonnect
```

---

## ⚙️ Step 6: Configure Environment Variables (3 minutes)

### 6.1 Create .env file

```bash
# Copy example file
cp .env.example .env

# Edit the file
nano .env
```

### 6.2 Fill in these REQUIRED values:

```env
# MongoDB Password (generate strong password)
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# Generate secrets (run these commands and copy results)
# openssl rand -hex 32
JWT_SECRET=PASTE_GENERATED_SECRET_HERE
JWT_REFRESH_SECRET=PASTE_GENERATED_SECRET_HERE
NEXTAUTH_SECRET=PASTE_GENERATED_SECRET_HERE

# Cloudinary (get from https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# URLs (replace with your domain or IP)
NEXT_PUBLIC_API_URL=http://YOUR_DROPLET_IP:5000/api
NEXTAUTH_URL=http://YOUR_DROPLET_IP:3000
CORS_ORIGINS=http://YOUR_DROPLET_IP:3000

# Jitsi Configuration (IMPORTANT!)
# Get your server IP: curl ifconfig.me
JITSI_DOMAIN=YOUR_DROPLET_IP:8080
JITSI_PUBLIC_URL=http://YOUR_DROPLET_IP:8080
JITSI_DOCKER_HOST_ADDRESS=YOUR_DROPLET_IP

# Generate Jitsi passwords
# openssl rand -hex 16 (run 3 times for the passwords below)
JITSI_JICOFO_COMPONENT_SECRET=PASTE_HERE
JITSI_JICOFO_AUTH_PASSWORD=PASTE_HERE
JITSI_JVB_AUTH_PASSWORD=PASTE_HERE
```

**Quick way to generate secrets:**

```bash
# Generate all secrets at once
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)"
echo "JITSI_JICOFO_COMPONENT_SECRET=$(openssl rand -hex 16)"
echo "JITSI_JICOFO_AUTH_PASSWORD=$(openssl rand -hex 16)"
echo "JITSI_JVB_AUTH_PASSWORD=$(openssl rand -hex 16)"
```

### 6.3 Configure Backend .env

```bash
# Create backend .env
cd backend
cp env.example .env
nano .env
```

Add these:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://admin:YOUR_MONGO_PASSWORD@mongodb:27017/educonnect?authSource=admin
JWT_SECRET=YOUR_JWT_SECRET
JWT_REFRESH_SECRET=YOUR_JWT_REFRESH_SECRET
SESSION_SECRET=YOUR_JWT_SECRET
CORS_ORIGINS=http://YOUR_DROPLET_IP:3000
TRUST_PROXY=true
JITSI_DOMAIN=YOUR_DROPLET_IP:8080
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 6.4 Configure Frontend .env.local

```bash
# Create frontend .env.local
cd ../frontend
cp env.example .env.local
nano .env.local
```

Add these:

```env
NEXT_PUBLIC_API_URL=http://YOUR_DROPLET_IP:5000/api
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET
NEXTAUTH_URL=http://YOUR_DROPLET_IP:3000
NEXT_PUBLIC_JITSI_DOMAIN=YOUR_DROPLET_IP:8080
```

---

## 🚀 Step 7: Deploy! (2 minutes)

### Option A: Use Deployment Script (Easiest)

```bash
# Go back to project root
cd /opt/educonnect

# Make script executable
chmod +x deploy-digitalocean.sh

# Run deployment
./deploy-digitalocean.sh
```

### Option B: Manual Deployment

```bash
# Build and start all services
docker compose build
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

---

## ✅ Step 8: Verify Deployment (1 minute)

### Check Services

```bash
# Check all services are running
docker compose ps

# Test backend
curl http://localhost:5000/health

# Test frontend
curl http://localhost:3000

# Test Jitsi
curl http://localhost:8080
```

### Access Your Application

Open in browser:
- **Frontend**: `http://YOUR_DROPLET_IP:3000`
- **Backend API**: `http://YOUR_DROPLET_IP:5000`
- **Jitsi Meet**: `http://YOUR_DROPLET_IP:8080`
- **Health Check**: `http://YOUR_DROPLET_IP:5000/health`

---

## 🎉 You're Done!

Your EduConnect backend is now deployed on DigitalOcean!

---

## 📝 Useful Commands

```bash
# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f jitsi-web

# Restart services
docker compose restart

# Stop services
docker compose down

# Update and redeploy
git pull
docker compose build
docker compose up -d

# Check resource usage
docker stats
```

---

## 🔧 Troubleshooting

### Services Not Starting

```bash
# Check logs
docker compose logs

# Check if ports are in use
netstat -tulpn | grep -E '5000|3000|8080'

# Restart Docker
systemctl restart docker
docker compose up -d
```

### Jitsi Not Working

```bash
# Check Jitsi logs
docker compose logs jitsi-jvb

# Verify DOCKER_HOST_ADDRESS is set correctly
grep JITSI_DOCKER_HOST_ADDRESS .env

# Get your server IP
curl ifconfig.me
```

### Backend Not Responding

```bash
# Check backend logs
docker compose logs backend

# Check MongoDB connection
docker compose exec mongodb mongosh -u admin -p

# Restart backend
docker compose restart backend
```

### Out of Memory

If you see memory errors, upgrade your droplet:
- Minimum: 4GB RAM
- Recommended: 8GB RAM
- With Jitsi: 8GB+ RAM

---

## 🌐 Next Steps (Optional)

### 1. Set Up Domain Name

1. Point your domain to your droplet IP:
   - `A record`: `@` → `YOUR_DROPLET_IP`
   - `A record`: `api` → `YOUR_DROPLET_IP`
   - `A record`: `meet` → `YOUR_DROPLET_IP`

2. Update `.env` files with your domain

3. Set up SSL with Let's Encrypt (see full guide)

### 2. Set Up Nginx Reverse Proxy

See `DIGITALOCEAN_DEPLOYMENT.md` for Nginx configuration

### 3. Set Up Monitoring

- DigitalOcean Monitoring (built-in)
- Uptime monitoring (UptimeRobot, etc.)

---

## 📚 Need More Help?

- **Full Guide**: See `DIGITALOCEAN_DEPLOYMENT.md`
- **Jitsi Setup**: See `JITSI_SELF_HOSTED_SETUP.md`
- **Troubleshooting**: Check logs with `docker compose logs`

---

**That's it! Your backend is deployed! 🎉**



