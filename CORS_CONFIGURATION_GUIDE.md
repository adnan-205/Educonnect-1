# 🌐 CORS Configuration Guide

## Your Current Configuration

```env
CORS_ORIGINS=http://localhost:3000,https://educonnect-1.vercel.app
```

---

## ✅ Recommendation: Keep Both

You can keep both URLs. Here's why:

### Option 1: Keep Both (Recommended)
```env
CORS_ORIGINS=http://localhost:3000,https://educonnect-1.vercel.app
```

**Pros:**
- ✅ Allows local development testing
- ✅ Allows production (Vercel)
- ✅ No need to change config when switching environments

**When to use:** 
- You develop locally sometimes
- You want flexibility

### Option 2: Remove Localhost (Production Only)
```env
CORS_ORIGINS=https://educonnect-1.vercel.app
```

**Pros:**
- ✅ Cleaner production config
- ✅ No unnecessary localhost entry

**When to use:**
- Pure production server
- Never develop locally against this server

---

## ⚠️ Important: Remove Extra Spaces

Your current config has a **space after the comma**:

```env
# ❌ WRONG (has extra space)
CORS_ORIGINS=http://localhost:3000, https://educonnect-1.vercel.app
                                 ^ extra space here

# ✅ CORRECT (no space)
CORS_ORIGINS=http://localhost:3000,https://educonnect-1.vercel.app
```

The backend code does trim spaces, but it's better to be explicit.

---

## 📝 Recommended Configuration

### For Production Server (DigitalOcean)

```env
# Option A: Keep both (allows local dev too)
CORS_ORIGINS=http://localhost:3000,https://educonnect-1.vercel.app

# Option B: Production only (cleaner)
CORS_ORIGINS=https://educonnect-1.vercel.app
```

### If You Have Multiple Vercel URLs

Vercel creates multiple URLs:
- Production: `https://educonnect-1.vercel.app`
- Preview: `https://educonnect-1-git-main-username.vercel.app`

Add all of them:

```env
CORS_ORIGINS=http://localhost:3000,https://educonnect-1.vercel.app,https://educonnect-1-*.vercel.app
```

Or use the pattern I added (auto-allows all `*.vercel.app` domains).

---

## 🔧 How to Update

### On Your DigitalOcean Server:

```bash
# 1. Edit backend .env
cd /opt/educonnect
nano backend/.env

# 2. Find CORS_ORIGINS line and update to:
CORS_ORIGINS=http://localhost:3000,https://educonnect-1.vercel.app

# Make sure NO spaces after comma!

# 3. Save (Ctrl+X, then Y, then Enter)

# 4. Restart backend
docker compose restart backend

# 5. Verify
docker compose logs backend | grep -i cors
```

---

## ✅ Final Answer

**Keep both URLs** (remove the space after comma):

```env
CORS_ORIGINS=http://localhost:3000,https://educonnect-1.vercel.app
```

**Why:**
- ✅ Allows local development if needed
- ✅ Allows Vercel production
- ✅ No harm in keeping localhost (can't access it from outside anyway)

**If you only want production:**
```env
CORS_ORIGINS=https://educonnect-1.vercel.app
```

---

## 🧪 Test CORS Configuration

After updating, test from browser console on your Vercel site:

```javascript
fetch('http://129.212.237.102/api/gigs')
  .then(r => r.json())
  .then(data => console.log('✅ CORS Working!', data))
  .catch(err => console.error('❌ CORS Error:', err));
```

If you see data, CORS is working! ✅


