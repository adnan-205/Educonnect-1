# 🔧 MongoDB Disconnection Troubleshooting Guide

## Common Reasons MongoDB Shows as "DISCONNECTED"

### 1. **MongoDB Container Not Running**

**Check:**
```bash
# Check if MongoDB container is running
docker compose ps

# Check MongoDB logs
docker compose logs mongodb

# Start MongoDB if not running
docker compose up -d mongodb
```

**Solution:**
```bash
# Restart MongoDB
docker compose restart mongodb

# Or start all services
docker compose up -d
```

---

### 2. **Wrong MONGODB_URI in Backend .env**

**Check your `backend/.env` file:**

**For Docker Compose (local MongoDB):**
```env
MONGODB_URI=mongodb://admin:YOUR_PASSWORD@mongodb:27017/educonnect?authSource=admin
```

**For MongoDB Atlas (cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/educonnect
```

**Common Mistakes:**
- ❌ Using `localhost` instead of `mongodb` (in Docker)
- ❌ Wrong password
- ❌ Missing `authSource=admin`
- ❌ Wrong database name

**Solution:**
```bash
# Edit backend .env
cd backend
nano .env

# Make sure MONGODB_URI matches your setup
# For Docker: mongodb://admin:PASSWORD@mongodb:27017/educonnect?authSource=admin
# For Atlas: mongodb+srv://USER:PASS@cluster.mongodb.net/educonnect
```

---

### 3. **MongoDB Not Ready When Backend Starts**

Backend might start before MongoDB is ready.

**Check:**
```bash
# Check if MongoDB is healthy
docker compose exec mongodb mongosh --eval "db.runCommand('ping')"

# Check backend logs for connection errors
docker compose logs backend | grep -i mongo
```

**Solution - Add dependency wait:**

Update `docker-compose.yml`:
```yaml
backend:
  depends_on:
    mongodb:
      condition: service_healthy
```

---

### 4. **MongoDB Authentication Failed**

**Check:**
```bash
# Test MongoDB connection manually
docker compose exec mongodb mongosh -u admin -p YOUR_PASSWORD

# Check if credentials match
docker compose exec mongodb mongosh --eval "db.adminCommand('listUsers')"
```

**Solution:**
1. Check `MONGO_ROOT_USERNAME` and `MONGO_ROOT_PASSWORD` in root `.env`
2. Make sure `MONGODB_URI` in `backend/.env` uses same credentials
3. Restart both services:
   ```bash
   docker compose restart mongodb backend
   ```

---

### 5. **Network Issues (Docker)**

**Check:**
```bash
# Check if containers are on same network
docker network ls
docker network inspect educonnect_educonnect-network

# Check if backend can reach MongoDB
docker compose exec backend ping mongodb
```

**Solution:**
```bash
# Recreate network
docker compose down
docker compose up -d
```

---

### 6. **MongoDB Container Crashed**

**Check:**
```bash
# Check MongoDB container status
docker compose ps mongodb

# Check MongoDB logs for errors
docker compose logs mongodb --tail 50
```

**Common Errors:**
- Out of memory
- Disk space full
- Port already in use

**Solution:**
```bash
# Restart MongoDB
docker compose restart mongodb

# If still failing, check system resources
df -h  # Check disk space
free -h  # Check memory
```

---

## 🔍 Diagnostic Steps

### Step 1: Check MongoDB Status
```bash
# Check if MongoDB container is running
docker compose ps mongodb

# Expected output:
# CONTAINER ID   IMAGE        STATUS         PORTS                    NAMES
# xxxxx          mongo:7.0    Up X minutes   0.0.0.0:27017->27017/tcp educonnect-mongodb
```

### Step 2: Test MongoDB Connection
```bash
# Test from host machine
docker compose exec mongodb mongosh --eval "db.runCommand('ping')"

# Expected output:
# { ok: 1 }
```

### Step 3: Check Backend Connection String
```bash
# Check backend .env
cat backend/.env | grep MONGODB_URI

# For Docker, should be:
# MONGODB_URI=mongodb://admin:PASSWORD@mongodb:27017/educonnect?authSource=admin
```

### Step 4: Check Backend Logs
```bash
# Check for MongoDB connection errors
docker compose logs backend | grep -i mongo

# Look for:
# - "MongoDB Connected: ..." (good)
# - "MongoDB connection error" (bad)
# - "MongoDB disconnected" (bad)
```

### Step 5: Test Health Endpoint
```bash
# Check health endpoint
curl http://localhost:5000/health/detailed

# Expected response:
# {
#   "status": "OK",
#   "services": {
#     "database": "OK"  // Should be "OK", not "DISCONNECTED"
#   }
# }
```

---

## 🛠️ Quick Fixes

### Fix 1: Restart All Services
```bash
docker compose down
docker compose up -d
```

### Fix 2: Recreate MongoDB Container
```bash
# Stop and remove MongoDB (data preserved in volume)
docker compose stop mongodb
docker compose rm -f mongodb
docker compose up -d mongodb

# Wait for MongoDB to be ready
sleep 10

# Restart backend
docker compose restart backend
```

### Fix 3: Fix Connection String
```bash
# Edit backend .env
cd backend
nano .env

# Update MONGODB_URI:
# For Docker:
MONGODB_URI=mongodb://admin:YOUR_PASSWORD@mongodb:27017/educonnect?authSource=admin

# Restart backend
docker compose restart backend
```

### Fix 4: Check Environment Variables
```bash
# Verify root .env has MongoDB credentials
cat .env | grep MONGO

# Should have:
# MONGO_ROOT_USERNAME=admin
# MONGO_ROOT_PASSWORD=your_password

# Verify backend .env uses same password
cat backend/.env | grep MONGODB_URI
```

---

## 📋 Common Connection String Formats

### Docker Compose (Local MongoDB)
```env
MONGODB_URI=mongodb://admin:password123@mongodb:27017/educonnect?authSource=admin
```

### MongoDB Atlas (Cloud)
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/educonnect?retryWrites=true&w=majority
```

### Local MongoDB (No Docker)
```env
MONGODB_URI=mongodb://localhost:27017/educonnect
```

---

## ✅ Verification Checklist

- [ ] MongoDB container is running (`docker compose ps`)
- [ ] MongoDB is healthy (`docker compose exec mongodb mongosh --eval "db.runCommand('ping')"`)
- [ ] `MONGODB_URI` is correct in `backend/.env`
- [ ] Password matches in root `.env` and `backend/.env`
- [ ] Backend can reach MongoDB (`docker compose exec backend ping mongodb`)
- [ ] No port conflicts (27017 not used by another service)
- [ ] Health endpoint shows database as "OK"

---

## 🆘 Still Not Working?

### Check Full Logs
```bash
# MongoDB logs
docker compose logs mongodb --tail 100

# Backend logs
docker compose logs backend --tail 100

# All logs
docker compose logs --tail 100
```

### Test Connection Manually
```bash
# From backend container
docker compose exec backend sh
# Then inside container:
node -e "require('mongoose').connect('mongodb://admin:PASSWORD@mongodb:27017/educonnect?authSource=admin').then(() => console.log('Connected!')).catch(e => console.error(e))"
```

### Reset Everything (Last Resort)
```bash
# ⚠️ WARNING: This will delete all data!
docker compose down -v
docker compose up -d
```

---

## 📝 Example Working Configuration

**Root `.env`:**
```env
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=MySecurePassword123
MONGO_DB_NAME=educonnect
```

**Backend `.env`:**
```env
MONGODB_URI=mongodb://admin:MySecurePassword123@mongodb:27017/educonnect?authSource=admin
```

**docker-compose.yml:**
```yaml
mongodb:
  environment:
    MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
```

---

**If you're still having issues, share the output of:**
```bash
docker compose ps
docker compose logs mongodb --tail 20
docker compose logs backend --tail 20 | grep -i mongo
```



