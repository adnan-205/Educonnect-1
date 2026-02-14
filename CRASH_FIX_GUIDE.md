# 504 Gateway Timeout Crash Fix - Complete Guide

## 🔴 Critical Issue Identified & Fixed

### Root Cause
Your Next.js frontend was calling **undefined API methods**, causing the entire application to crash in a loop:

**Missing Methods in `frontend/services/api.ts`:**
1. `bookingsApi.getJoinDetails()` ❌
2. `bookingsApi.getPaymentStatus()` ❌
3. `bookingsApi.submitPaymentProof()` ❌
4. `bookingsApi.verifyPayment()` ❌
5. `bookingsApi.rejectPayment()` ❌
6. `teacherPaymentApi` (entire export) ❌

### What Happened
```javascript
// Code tried to call:
const res = await bookingsApi.getJoinDetails(booking._id)  // ← returns undefined!
const data = res.data  // ← CRASH: "Cannot read properties of undefined (reading 'data')"
```

The `.aa` property you saw in error logs was likely from a **minified/obfuscated stack trace**. The real issue was accessing properties on `undefined`.

---

## ✅ What Was Fixed

### 1. Added Missing API Methods

**File:** `frontend/services/api.ts`

Added to `bookingsApi`:
```typescript
getJoinDetails(bookingId)      // Get meeting details for joining class
getPaymentStatus(bookingId)    // Get manual payment status
submitPaymentProof(...)        // Submit payment proof to teacher
verifyPayment(bookingId)       // Teacher verifies payment
rejectPayment(bookingId, reason) // Teacher rejects payment
```

Created new `teacherPaymentApi`:
```typescript
upsertPaymentInfo(payload)     // Teacher sets payment info
getMyPaymentInfo()             // Get own payment info
getTeacherPaymentInfo(teacherId) // Get teacher's payment details
```

All methods include:
- ✅ Proper error handling
- ✅ Type-safe parameters
- ✅ URL encoding for IDs
- ✅ Descriptive console logging

---

## 🚀 Deployment Instructions

### Local Testing First

1. **Rebuild the frontend:**
   ```bash
   cd frontend
   npm run build
   npm start
   ```

2. **Test the manual payment flow:**
   - Student books a class
   - Student navigates to payment page
   - Student submits payment proof
   - Teacher verifies payment
   - Student joins class

3. **Check for errors:**
   ```bash
   npm run dev
   # Open browser console - should see no crashes
   ```

---

## 🌐 Production Environment Configuration

### ⚠️ Critical: Fix Your API URL

**Current Issue:** Your `.env.local` uses `localhost` which **won't work in production**.

#### Option 1: Environment-Specific URLs (Recommended)

**Frontend `.env.production`** (create this file):
```env
# Production API URL - REPLACE WITH YOUR ACTUAL BACKEND URL
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api

# OR if using same domain:
# NEXT_PUBLIC_API_URL=/api

# Clerk (production keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET

# Cloudinary (use same or production account)
CLOUDINARY_CLOUD_NAME=dh4ojcnwu
CLOUDINARY_API_KEY=348998516421713
CLOUDINARY_API_SECRET=HLbgtOnNpdoHpNs37Kwnp0PWiJ4

# Jitsi
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
NEXT_PUBLIC_JITSI_AUTO_END_DISABLED=true

# Site Info
NEXT_PUBLIC_SITE_URL=https://your-frontend.vercel.app
NEXT_PUBLIC_SITE_NAME=TutorConnected
NEXT_PUBLIC_SITE_DESCRIPTION=Connect students and teachers for online learning
```

**Backend Environment (Render/Production):**
Update these in your hosting dashboard:
```env
NODE_ENV=production
PORT=5000
TRUST_PROXY=true

# CORS - Allow your frontend domain
CORS_ORIGINS=https://your-frontend.vercel.app,https://yourdomain.com

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/educonnect-prod

# JWT Secrets (generate strong secrets!)
JWT_SECRET=your-super-strong-secret-32-chars-minimum
JWT_REFRESH_SECRET=different-strong-secret-32-chars

# Cloudinary
CLOUDINARY_CLOUD_NAME=dh4ojcnwu
CLOUDINARY_API_KEY=348998516421713
CLOUDINARY_API_SECRET=HLbgtOnNpdoHpNs37Kwnp0PWiJ4
```

#### Option 2: Use 127.0.0.1 Instead of localhost (Local Fix)

If experiencing ECONNRESET locally:
```env
# Change this:
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# To this:
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api
```

This can fix DNS resolution issues on some systems.

---

## 🔍 Verifying the Fix

### 1. Check API Calls Work

Open browser console and test:
```javascript
// Should not crash anymore
const result = await fetch('/api/bookings/BOOKING_ID/join')
console.log(result) // Should get 403/404, not crash
```

### 2. Monitor PM2 Logs

```bash
pm2 logs
# Should see successful API calls, no more crashes
```

### 3. Test Manual Payment Flow

**Student Side:**
1. Navigate to `/dashboard/join-class`
2. Click "Join Now" on an accepted booking
3. If payment needed → redirects to `/dashboard/bookings/[id]/payment`
4. Submit payment proof ✅

**Teacher Side:**
1. Navigate to `/dashboard/bookings`
2. See payment verification card
3. Verify or reject payment ✅

---

## 🛠️ Troubleshooting

### Still Getting ECONNRESET?

**Check Backend is Running:**
```bash
# Backend should be accessible
curl http://localhost:5000/health
# OR
curl http://127.0.0.1:5000/health
```

**Check CORS Settings:**
Backend should allow your frontend origin. Check `backend/src/server.ts:79-126`.

### Still Getting 504?

**Increase Timeout in Frontend:**
Edit `frontend/services/api.ts:11`:
```typescript
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increase to 30 seconds
});
```

### Network Errors in Production

**Use Internal URLs for Server-Side Calls:**

If your frontend makes SSR calls to backend on the same server:
```typescript
// In getServerSideProps or Server Components
const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL

// .env (backend)
INTERNAL_API_URL=http://localhost:5000/api
```

---

## 📋 Deployment Checklist

- [ ] Frontend rebuilt with `npm run build`
- [ ] All API methods tested locally
- [ ] Production environment variables set
- [ ] CORS origins include production frontend URL
- [ ] Backend deployed and accessible
- [ ] Frontend deployed
- [ ] Manual payment flow tested end-to-end
- [ ] PM2/Vercel logs show no crashes
- [ ] 504 errors resolved

---

## 🎯 Summary

**The Fix:**
- ✅ Added 8 missing API methods to `frontend/services/api.ts`
- ✅ All methods have proper error handling
- ✅ No more undefined method calls → No more crashes

**Environment:**
- ⚠️ Update `NEXT_PUBLIC_API_URL` for production
- ⚠️ Update `CORS_ORIGINS` in backend
- ⚠️ Use `127.0.0.1` instead of `localhost` if needed

**Result:**
Your app should now:
- ✅ Not crash when students try to join classes
- ✅ Handle manual payments correctly
- ✅ Show proper error messages instead of 504
- ✅ Run stably in production

---

## 📞 Next Steps

1. Test locally first
2. Update production environment variables
3. Deploy to production
4. Monitor logs for 24 hours
5. If issues persist, check:
   - CORS configuration
   - Backend logs
   - Network connectivity between services
