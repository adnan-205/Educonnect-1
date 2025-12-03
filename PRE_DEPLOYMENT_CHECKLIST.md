# ✅ Pre-Deployment Checklist

Use this checklist before deploying to DigitalOcean to ensure everything is ready.

---

## 📋 Before You Start

- [ ] DigitalOcean account created
- [ ] Domain name ready (optional but recommended)
- [ ] Cloudinary account set up (for image uploads)
- [ ] MongoDB Atlas account OR plan to use Docker MongoDB

---

## 🖥️ Server Requirements

- [ ] Droplet created: **8GB RAM / 4 vCPUs minimum**
- [ ] Ubuntu 22.04 LTS installed
- [ ] SSH access configured
- [ ] Firewall ports opened (80, 443, 5000, 8080, 10000/udp)

---

## 🔑 Environment Variables to Prepare

### Generate Secrets First

Run these commands and save the outputs:

```bash
# JWT Secrets (32 characters each)
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For JWT_REFRESH_SECRET
openssl rand -hex 32  # For NEXTAUTH_SECRET

# Jitsi Secrets (16 characters each)
openssl rand -hex 16  # For JITSI_JICOFO_COMPONENT_SECRET
openssl rand -hex 16  # For JITSI_JICOFO_AUTH_PASSWORD
openssl rand -hex 16  # For JITSI_JVB_AUTH_PASSWORD
```

### Required Information

- [ ] **MongoDB Password** - Strong password for database
- [ ] **JWT_SECRET** - Generated above
- [ ] **JWT_REFRESH_SECRET** - Generated above
- [ ] **NEXTAUTH_SECRET** - Generated above
- [ ] **Cloudinary Cloud Name** - From Cloudinary dashboard
- [ ] **Cloudinary API Key** - From Cloudinary dashboard
- [ ] **Cloudinary API Secret** - From Cloudinary dashboard
- [ ] **Server IP Address** - Get with `curl ifconfig.me` on server
- [ ] **Domain Name** (if using) - Your domain name

---

## 📝 Files to Configure

### Root `.env` File

- [ ] Copied from `.env.example`
- [ ] `MONGO_ROOT_PASSWORD` set
- [ ] `JWT_SECRET` set
- [ ] `JWT_REFRESH_SECRET` set
- [ ] `NEXTAUTH_SECRET` set
- [ ] `CLOUDINARY_*` variables set
- [ ] `JITSI_DOCKER_HOST_ADDRESS` set to server IP
- [ ] `JITSI_JICOFO_COMPONENT_SECRET` set
- [ ] `JITSI_JICOFO_AUTH_PASSWORD` set
- [ ] `JITSI_JVB_AUTH_PASSWORD` set
- [ ] URLs updated (domain or IP)

### Backend `.env` File

- [ ] Copied from `backend/env.example`
- [ ] `MONGODB_URI` configured (mongodb://admin:PASSWORD@mongodb:27017/...)
- [ ] `JWT_SECRET` matches root .env
- [ ] `JWT_REFRESH_SECRET` matches root .env
- [ ] `JITSI_DOMAIN` set
- [ ] `CLOUDINARY_*` variables set
- [ ] `CORS_ORIGINS` set correctly

### Frontend `.env.local` File

- [ ] Copied from `frontend/env.example`
- [ ] `NEXT_PUBLIC_API_URL` set
- [ ] `NEXTAUTH_SECRET` matches root .env
- [ ] `NEXTAUTH_URL` set
- [ ] `NEXT_PUBLIC_JITSI_DOMAIN` matches backend JITSI_DOMAIN

---

## 🐳 Docker Configuration

- [ ] Docker installed on server
- [ ] Docker Compose installed on server
- [ ] User added to docker group
- [ ] `docker-compose.yml` present in project root
- [ ] All services defined in docker-compose.yml

---

## 📚 Documentation Read

- [ ] Read `QUICK_DEPLOY_DIGITALOCEAN.md`
- [ ] Understand deployment steps
- [ ] Know how to troubleshoot (check logs)

---

## 🚀 Deployment Steps

- [ ] Server setup script run (`setup-server.sh`)
- [ ] Project cloned to server
- [ ] Environment files configured
- [ ] Deployment script run (`deploy-digitalocean.sh`)
- [ ] Services verified running (`docker compose ps`)
- [ ] Health checks passing

---

## ✅ Post-Deployment Verification

### Service Checks

- [ ] Backend health: `curl http://YOUR_IP:5000/health`
- [ ] Frontend accessible: `curl http://YOUR_IP:3000`
- [ ] Jitsi accessible: `curl http://YOUR_IP:8080`
- [ ] MongoDB connected (check backend logs)

### Application Tests

- [ ] User registration works
- [ ] User login works
- [ ] Create gig works (teacher)
- [ ] Book class works (student)
- [ ] Accept booking works (teacher)
- [ ] Room ID generated correctly
- [ ] Join meeting works (both student and teacher)

---

## 🔒 Security Checklist

- [ ] Strong passwords used (all secrets)
- [ ] Firewall configured (UFW enabled)
- [ ] Non-root user created (optional but recommended)
- [ ] SSH keys configured (not password auth)
- [ ] Environment files not committed to git
- [ ] `.env` files have correct permissions (600)

---

## 📊 Monitoring Setup

- [ ] Logs accessible (`docker compose logs`)
- [ ] Resource monitoring (`docker stats`)
- [ ] Health check endpoints working
- [ ] Backup strategy planned (MongoDB)

---

## 🆘 Troubleshooting Prepared

- [ ] Know how to view logs: `docker compose logs -f`
- [ ] Know how to restart: `docker compose restart`
- [ ] Know how to check status: `docker compose ps`
- [ ] Have documentation links ready

---

## ✨ Final Checks

- [ ] All environment variables set
- [ ] All services configured
- [ ] Documentation reviewed
- [ ] Deployment script ready
- [ ] Server access confirmed
- [ ] Backup plan in place

---

## 🎯 Ready to Deploy?

If all items above are checked, you're ready! Follow:

1. **Quick Guide**: `QUICK_DEPLOY_DIGITALOCEAN.md`
2. **Full Guide**: `DIGITALOCEAN_DEPLOYMENT.md`

**Good luck! 🚀**



