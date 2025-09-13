# EduConnect Production Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose (recommended) OR PM2
- MongoDB Atlas account or local MongoDB
- Cloudinary account for file uploads
- SSL certificate for HTTPS (production)

### Environment Setup

1. **Backend Environment Variables**
   ```bash
   cp backend/.env.production backend/.env
   # Edit backend/.env with your production values
   ```

2. **Frontend Environment Variables**
   ```bash
   cp frontend/.env.production frontend/.env.local
   # Edit frontend/.env.local with your production values
   ```

3. **Docker Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Docker deployment values
   ```

## 🐳 Docker Deployment (Recommended)

### 1. Build and Deploy
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### 2. Manual Docker Commands
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Environment Variables for Docker
Create `.env` file in root directory:
```env
# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_secure_password
MONGO_DB_NAME=educonnect

# JWT Secrets (32+ characters)
JWT_SECRET=your_jwt_secret_32_characters_minimum
JWT_REFRESH_SECRET=your_refresh_secret_32_characters_min

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_32_characters_min
NEXTAUTH_URL=https://yourdomain.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 📱 Traditional Deployment (PM2)

### 1. Install Dependencies
```bash
# Backend
cd backend
npm ci --only=production
npm run build

# Frontend
cd ../frontend
npm ci --only=production
npm run build
```

### 2. Install PM2
```bash
npm install -g pm2
```

### 3. Start Services
```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

## 🔒 Security Checklist

### Environment Variables
- [ ] Strong JWT secrets (32+ characters)
- [ ] Secure database credentials
- [ ] Production API URLs
- [ ] Valid SSL certificates

### Backend Security
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] Helmet security headers
- [ ] Input validation on all routes
- [ ] MongoDB injection protection
- [ ] File upload limits configured

### Frontend Security
- [ ] Remove development console logs
- [ ] Secure authentication configuration
- [ ] CSP headers configured
- [ ] Image optimization enabled

## 🌐 Domain & SSL Setup

### 1. Domain Configuration
Point your domain to your server:
```
A Record: yourdomain.com → Your Server IP
CNAME: www.yourdomain.com → yourdomain.com
```

### 2. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Nginx Configuration
Update `nginx/nginx.conf` with your domain and SSL paths.

## 📊 Monitoring & Health Checks

### Health Endpoints
- Backend: `https://api.yourdomain.com/health`
- Detailed: `https://api.yourdomain.com/health/detailed`
- Database: `https://api.yourdomain.com/health/ready`

### PM2 Monitoring
```bash
# View processes
pm2 list

# Monitor resources
pm2 monit

# View logs
pm2 logs

# Restart services
pm2 restart all
```

### Docker Monitoring
```bash
# View container status
docker-compose ps

# Check resource usage
docker stats

# View logs
docker-compose logs -f [service_name]
```

## 🔧 Maintenance Commands

### Database Backup
```bash
# MongoDB backup
mongodump --uri="your_mongodb_uri" --out=backup/$(date +%Y%m%d)
```

### Log Rotation
```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Updates & Deployment
```bash
# Pull latest code
git pull origin main

# Rebuild and restart (Docker)
docker-compose build --no-cache
docker-compose up -d

# Rebuild and restart (PM2)
npm run build
pm2 restart all
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :5000
   # Kill process
   kill -9 <PID>
   ```

2. **MongoDB Connection Failed**
   - Check MongoDB URI format
   - Verify network access and firewall
   - Ensure database user has correct permissions

3. **SSL Certificate Issues**
   ```bash
   # Test SSL
   openssl s_client -connect yourdomain.com:443
   # Renew certificate
   sudo certbot renew
   ```

4. **Memory Issues**
   ```bash
   # Check memory usage
   free -h
   # Restart services if needed
   pm2 restart all
   ```

### Log Locations
- PM2 Logs: `./logs/`
- Docker Logs: `docker-compose logs`
- Nginx Logs: `/var/log/nginx/`
- System Logs: `/var/log/syslog`

## 📈 Performance Optimization

### Database Indexing
```javascript
// Add indexes in MongoDB
db.users.createIndex({ email: 1 })
db.gigs.createIndex({ teacher: 1, category: 1 })
db.bookings.createIndex({ student: 1, createdAt: -1 })
```

### CDN Setup
Configure Cloudinary or AWS CloudFront for static assets.

### Caching
- Redis for session storage
- Nginx caching for static files
- Database query optimization

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        run: |
          ssh user@server 'cd /path/to/app && git pull && ./deploy.sh'
```

## 📞 Support

For deployment issues:
1. Check logs first
2. Verify environment variables
3. Test health endpoints
4. Review security settings
5. Monitor resource usage

Remember to keep your secrets secure and never commit them to version control!
