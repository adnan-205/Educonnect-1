# EduConnect Backend Deployment on Render

## 🚀 Quick Deploy to Render

### Prerequisites
- GitHub repository with your code
- Render account (free tier available)
- MongoDB Atlas account (or use Render PostgreSQL)
- Cloudinary account for file uploads

## 📋 Step-by-Step Deployment

### 1. Prepare Your Repository
```bash
# Ensure your code is pushed to GitHub
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Create New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository and branch (`main`)

### 3. Configure Build Settings

**Basic Settings:**
- **Name:** `educonnect-backend`
- **Region:** Choose closest to your users
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm start`

**Advanced Settings:**
- **Node Version:** `18`
- **Health Check Path:** `/health`
- **Auto-Deploy:** `Yes`

### 4. Environment Variables

Add these environment variables in Render dashboard:

#### Required Variables
```env
NODE_ENV=production
PORT=10000
TRUST_PROXY=true
```

#### Database (MongoDB Atlas)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/educonnect-prod
```

#### JWT Secrets (Generate strong 32+ character strings)
```env
JWT_SECRET=your-strong-jwt-secret-32-characters-minimum
JWT_REFRESH_SECRET=your-strong-refresh-secret-32-characters
JWT_EXPIRE=30d
JWT_REFRESH_EXPIRE=7d
SESSION_SECRET=your-strong-session-secret-32-characters
```

#### Security Settings
```env
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SECURE_COOKIES=true
```

#### CORS Configuration
```env
CORS_ORIGINS=https://your-frontend-app.onrender.com,https://yourdomain.com
```

#### Cloudinary Configuration
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### File Upload Settings
```env
MAX_FILE_SIZE=10485760
MAX_FILES_PER_REQUEST=5
LOG_LEVEL=info
```

#### Database Connection Pool
```env
DB_MAX_POOL_SIZE=10
DB_MIN_POOL_SIZE=5
DB_MAX_IDLE_TIME_MS=30000
```

### 5. Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your backend
3. Monitor the build logs for any issues

## 🔗 Post-Deployment Setup

### 1. Get Your Backend URL
After deployment, your backend will be available at:
```
https://your-service-name.onrender.com
```

### 2. Test Your Deployment
```bash
# Health check
curl https://your-service-name.onrender.com/health

# API test
curl https://your-service-name.onrender.com/api/auth/register
```

### 3. Update Frontend Configuration
Update your frontend's API URL:
```env
# frontend/.env.production
NEXT_PUBLIC_API_URL=https://your-service-name.onrender.com/api
```

## 🗄️ Database Options

### Option 1: MongoDB Atlas (Recommended)
1. Create MongoDB Atlas cluster
2. Get connection string
3. Add to `MONGODB_URI` environment variable

### Option 2: Render PostgreSQL
1. Create PostgreSQL database in Render
2. Update your backend to use PostgreSQL instead of MongoDB
3. Use the auto-generated `DATABASE_URL`

## 🔒 Security Checklist

- [ ] Strong JWT secrets (32+ characters)
- [ ] Secure MongoDB credentials
- [ ] CORS configured for your frontend domain
- [ ] HTTPS enabled (automatic on Render)
- [ ] Environment variables properly set
- [ ] Health checks working

## 📊 Monitoring

### Health Endpoints
- **Basic:** `https://your-app.onrender.com/health`
- **Detailed:** `https://your-app.onrender.com/health/detailed`
- **Ready:** `https://your-app.onrender.com/health/ready`
- **Live:** `https://your-app.onrender.com/health/live`

### Render Dashboard
- View logs in real-time
- Monitor resource usage
- Set up alerts for downtime

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Check package.json scripts
   # Ensure all dependencies are in package.json
   # Check Node version compatibility
   ```

2. **App Crashes on Start**
   ```bash
   # Check environment variables
   # Verify MongoDB connection string
   # Check logs in Render dashboard
   ```

3. **CORS Errors**
   ```bash
   # Update CORS_ORIGINS environment variable
   # Include your frontend domain
   # Check protocol (http vs https)
   ```

4. **Database Connection Issues**
   ```bash
   # Verify MongoDB URI format
   # Check network access in MongoDB Atlas
   # Ensure database user has correct permissions
   ```

### Render Free Tier Limitations
- Service spins down after 15 minutes of inactivity
- 750 hours/month free (enough for development)
- Cold starts may take 30+ seconds
- Consider upgrading for production use

## 🔄 Continuous Deployment

### Auto-Deploy Setup
1. Enable auto-deploy in Render dashboard
2. Every push to `main` branch triggers deployment
3. Monitor build status and logs

### Manual Deploy
```bash
# Trigger manual deploy via Render dashboard
# Or push to connected branch
git push origin main
```

## 📈 Performance Tips

### Render Optimization
- Use Render's built-in CDN
- Enable compression (already configured)
- Monitor response times
- Consider upgrading plan for better performance

### Database Optimization
- Use MongoDB Atlas M2+ for better performance
- Add database indexes for frequently queried fields
- Monitor database performance metrics

## 💰 Cost Considerations

### Free Tier
- 750 hours/month free
- Shared resources
- Cold starts
- Perfect for development/testing

### Paid Plans
- Starting at $7/month
- Always-on instances
- Better performance
- Custom domains
- Recommended for production

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/node-version)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Custom Domains](https://render.com/docs/custom-domains)

## 📞 Support

If you encounter issues:
1. Check Render logs first
2. Verify environment variables
3. Test health endpoints
4. Check MongoDB Atlas connectivity
5. Review CORS configuration

Your EduConnect backend is now ready for production on Render! 🎉
