# 📚 API Structure Guide

## Understanding the API Paths

### Base URLs

- **Root:** `http://129.212.237.102/`
- **API Base:** `http://129.212.237.102/api`

---

## ⚠️ Important: `/api` is NOT an Endpoint

`/api` is just the **base path** for all API routes. You cannot access it directly.

### ❌ This Won't Work:
```
GET http://129.212.237.102/api
→ Returns: "Cannot GET /api"
```

### ✅ Use These Instead:

All API endpoints are under `/api/...`:

```
GET  http://129.212.237.102/api/gigs          ✅ List all gigs
GET  http://129.212.237.102/api/gigs/:id      ✅ Get single gig
POST http://129.212.237.102/api/auth/login    ✅ Login
POST http://129.212.237.102/api/auth/register ✅ Register
```

---

## 📍 Available Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
```

### Gigs (Classes)
```
GET    /api/gigs           - List all gigs
GET    /api/gigs/:id       - Get single gig
POST   /api/gigs           - Create gig (Teacher, requires auth)
PUT    /api/gigs/:id       - Update gig (Teacher, requires auth)
DELETE /api/gigs/:id       - Delete gig (Teacher, requires auth)
```

### Bookings
```
GET  /api/bookings         - Get all bookings (requires auth)
GET  /api/bookings/:id     - Get single booking (requires auth)
POST /api/bookings         - Create booking (Student, requires auth)
PUT  /api/bookings/:id     - Update booking status (Teacher, requires auth)
```

### Payments
```
POST /api/payments/init            - Initialize payment (Student, requires auth)
GET  /api/payments/status/:gigId   - Get payment status (requires auth)
```

---

## 🔍 How to Test Endpoints

### Test Root (Shows API Info)
```bash
# Open in browser or use curl
http://129.212.237.102/

# Should show:
{
  "message": "Welcome to EduConnect API",
  "endpoints": { ... }
}
```

### Test Health Check
```bash
# Health endpoint
http://129.212.237.102/health

# Or
http://129.212.237.102/api/health
```

### Test Gigs Endpoint
```bash
# List all gigs (no auth required)
http://129.212.237.102/api/gigs

# In browser, open:
http://129.212.237.102/api/gigs
```

---

## 🎯 Quick Test Examples

### 1. Test if Backend is Running
```
GET http://129.212.237.102/
→ Should return: Welcome message with endpoints list
```

### 2. Test Health Check
```
GET http://129.212.237.102/health
→ Should return: {"status": "OK", ...}
```

### 3. Test Gigs API
```
GET http://129.212.237.102/api/gigs
→ Should return: List of gigs or empty array
```

### 4. Test Login
```
POST http://129.212.237.102/api/auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
→ Should return: JWT token and user data
```

---

## 🔧 Frontend Configuration

### In Your Frontend Code

The frontend should use the full path:

```javascript
// ✅ CORRECT
const response = await fetch('http://129.212.237.102/api/gigs');

// ❌ WRONG
const response = await fetch('http://129.212.237.102/api');
```

### Environment Variable

In Vercel, set:
```
NEXT_PUBLIC_API_URL=http://129.212.237.102/api
```

Then in code:
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL; // http://129.212.237.102/api
const response = await fetch(`${API_URL}/gigs`); // http://129.212.237.102/api/gigs
```

---

## 🐛 Troubleshooting

### "Cannot GET /api" Error

**This is normal!** `/api` is not an endpoint by itself.

**Solution:** Use specific endpoints like:
- ✅ `/api/gigs`
- ✅ `/api/auth/login`
- ✅ `/api/health`

### "Failed to load gigs" Error

**Possible causes:**

1. **CORS issue** - Backend not allowing Vercel domain
   - Fix: Add Vercel URL to `CORS_ORIGINS` in backend `.env`

2. **Wrong URL** - Frontend using wrong base URL
   - Fix: Set `NEXT_PUBLIC_API_URL=http://129.212.237.102/api` in Vercel

3. **Network issue** - Backend not accessible
   - Test: Open `http://129.212.237.102/health` in browser

---

## 📝 Summary

- ✅ **Root:** `http://129.212.237.102/` - Shows API info
- ✅ **API Base:** `http://129.212.237.102/api` - Base path for all endpoints
- ✅ **Endpoints:** Use `/api/gigs`, `/api/auth/login`, etc.
- ❌ **Don't use:** `/api` by itself (not an endpoint)

**Example endpoints:**
- `http://129.212.237.102/api/gigs` ✅
- `http://129.212.237.102/api/auth/login` ✅
- `http://129.212.237.102/api/bookings` ✅
- `http://129.212.237.102/api` ❌ (just the base path)


