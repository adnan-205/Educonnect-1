# 🔧 Fix: "Failed to load gigs" - Vercel Frontend + DigitalOcean Backend

## 🐛 Problem

Your frontend on Vercel can't connect to your backend at `http://129.212.237.102/` because:
1. **CORS is blocking** - Backend doesn't allow Vercel domain
2. **Frontend API URL not set** - Vercel doesn't know your backend URL

---

## ✅ Solution (2 Steps)

### Step 1: Configure Backend CORS

Add your Vercel domain to backend CORS configuration.

#### Option A: Using Environment Variable (Recommended)

On your DigitalOcean server, update `backend/.env`:

```bash
# Add your Vercel URL to CORS_ORIGINS
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-username.vercel.app
```

**Get your Vercel URL:**
- Go to your Vercel dashboard
- Your app URL is: `https://your-app-name.vercel.app`
- Or your custom domain if you have one

#### Option B: Update docker-compose.yml

Update root `.env` file:

```env
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-username.vercel.app
```

Then restart backend:
```bash
docker compose restart backend
```

---

### Step 2: Configure Frontend API URL in Vercel

Set the backend URL in Vercel environment variables.

#### In Vercel Dashboard:

1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `http://129.212.237.102/api`
   - **Environment:** Production, Preview, Development (select all)
4. Click **Save**
5. **Redeploy** your app (or wait for next deployment)

#### Or via Vercel CLI:

```bash
vercel env add NEXT_PUBLIC_API_URL
# Enter: http://129.212.237.102/api
# Select: Production, Preview, Development
```

---

## 🔍 Verify Configuration

### Check Backend CORS

Test from browser console on your Vercel site:

```javascript
fetch('http://129.212.237.102/api/gigs')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**If CORS is working:** You'll get data
**If CORS is blocking:** You'll see CORS error in console

### Check Frontend API URL

In your Vercel app, check browser console:
- Open DevTools (F12)
- Go to Network tab
- Look for requests to `/api/gigs`
- Check if URL is `http://129.212.237.102/api/gigs`

---

## 🚀 Quick Fix Commands

### On Your DigitalOcean Server:

```bash
# 1. Edit backend .env
cd /opt/educonnect
nano backend/.env

# 2. Add/Update CORS_ORIGINS (replace with your Vercel URL)
CORS_ORIGINS=https://your-app.vercel.app

# 3. Restart backend
docker compose restart backend

# 4. Check logs
docker compose logs backend | grep CORS
```

---

## 📝 Complete Example

### Backend `.env` (backend/.env):
```env
CORS_ORIGINS=https://educonnect-app.vercel.app,https://educonnect-app-git-main-yourusername.vercel.app
```

### Vercel Environment Variables:
```
NEXT_PUBLIC_API_URL=http://129.212.237.102/api
```

---

## 🔒 Security Note

For production, consider:
1. **Use HTTPS** for backend (set up SSL certificate)
2. **Use custom domain** instead of IP address
3. **Restrict CORS** to only your Vercel domain

---

## 🐛 Troubleshooting

### Still Getting CORS Error?

1. **Check exact Vercel URL:**
   - Go to Vercel dashboard
   - Copy exact URL (including `https://`)
   - Make sure it matches in `CORS_ORIGINS`

2. **Check backend logs:**
   ```bash
   docker compose logs backend | grep -i cors
   ```

3. **Test CORS directly:**
   ```bash
   curl -H "Origin: https://your-app.vercel.app" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        http://129.212.237.102/api/gigs \
        -v
   ```

### Frontend Still Using Wrong URL?

1. **Clear Vercel cache:**
   - Redeploy in Vercel dashboard
   - Or use: `vercel --prod`

2. **Check environment variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Make sure `NEXT_PUBLIC_API_URL` is set correctly

3. **Check browser console:**
   - Look for network requests
   - Verify they're going to `http://129.212.237.102/api`

---

## ✅ After Fixing

Your app should work! Test:
1. ✅ Load gigs list
2. ✅ View gig details
3. ✅ Create bookings
4. ✅ Make payments

---

## 📚 Related Files

- Backend CORS config: `backend/src/server.ts`
- Frontend API config: `frontend/services/api.ts`
- Environment example: `backend/env.example`, `frontend/env.example`

---

**After making these changes, redeploy both:**
1. Backend: `docker compose restart backend`
2. Frontend: Redeploy in Vercel (automatic or manual)



