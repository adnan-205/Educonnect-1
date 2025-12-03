# 💳 Payment API - Quick Reference Guide

## ❌ Common Error: "Cannot GET /post/api/payments/init"

### Problem
You're trying to access the payment endpoint incorrectly:
- ❌ Wrong URL: `/post/api/payments/init` (has extra `/post/` prefix)
- ❌ Wrong Method: Using GET (should be POST)

### ✅ Correct Usage

**Endpoint:** `POST /api/payments/init`

**Full URL:** `http://129.212.237.102/api/payments/init`

---

## 📝 Payment Endpoints

### 1. Initialize Payment (Create Payment)

**Method:** `POST` (not GET!)

**URL:** `/api/payments/init`

**Authentication:** ✅ Required (JWT token)

**Request Body:**
```json
{
  "gigId": "your_gig_id_here",
  "bookingId": "optional_booking_id"
}
```

**Example with cURL:**
```bash
curl -X POST http://129.212.237.102/api/payments/init \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "gigId": "507f1f77bcf86cd799439011"
  }'
```

**Example with JavaScript/Fetch:**
```javascript
const response = await fetch('http://129.212.237.102/api/payments/init', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${yourJwtToken}`
  },
  body: JSON.stringify({
    gigId: '507f1f77bcf86cd799439011',
    bookingId: 'optional_booking_id' // optional
  })
});

const data = await response.json();
console.log(data);
```

**Response:**
```json
{
  "success": true,
  "url": "https://sandbox.sslcommerz.com/...",
  "tran_id": "transaction_id_here"
}
```

---

### 2. Check Payment Status

**Method:** `GET`

**URL:** `/api/payments/status/:gigId`

**Authentication:** ✅ Required

**Example:**
```bash
curl http://129.212.237.102/api/payments/status/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Check Booking Payment Status

**Method:** `GET`

**URL:** `/api/payments/booking-status/:bookingId`

**Authentication:** ✅ Required

**Example:**
```bash
curl http://129.212.237.102/api/payments/booking-status/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔑 Authentication Required

All payment endpoints (except callbacks) require authentication.

### How to Get JWT Token

1. **Login first:**
```bash
curl -X POST http://129.212.237.102/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "your_password"
  }'
```

2. **Response includes token:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

3. **Use token in Authorization header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🐛 Troubleshooting

### Error: "Cannot GET /post/api/payments/init"

**Solution:**
- ✅ Use **POST** method (not GET)
- ✅ Remove `/post/` prefix
- ✅ Use correct URL: `/api/payments/init`

### Error: "Unauthorized" or 401

**Solution:**
- ✅ Include JWT token in Authorization header
- ✅ Make sure token is valid (not expired)
- ✅ Login first to get a token

### Error: "gigId is required"

**Solution:**
- ✅ Include `gigId` in request body
- ✅ Make sure `gigId` is a valid MongoDB ObjectId

### Error: "Payment initialization failed"

**Solution:**
- ✅ Check SSLCommerz configuration in backend
- ✅ Verify SSLCommerz credentials in environment variables
- ✅ Check backend logs for detailed error

---

## 📋 Complete Payment Flow

1. **Student creates booking:**
   ```
   POST /api/bookings
   ```

2. **Teacher accepts booking:**
   ```
   PUT /api/bookings/:id
   (status: "accepted")
   ```

3. **Student initiates payment:**
   ```
   POST /api/payments/init
   {
     "gigId": "...",
     "bookingId": "..."
   }
   ```

4. **Student redirected to payment gateway**

5. **Payment callbacks (automatic):**
   - Success: `POST /api/payments/success/:tran_id`
   - Fail: `POST /api/payments/fail/:tran_id`
   - Cancel: `POST /api/payments/cancel/:tran_id`

6. **Check payment status:**
   ```
   GET /api/payments/status/:gigId
   ```

---

## ✅ Quick Test

### Test Payment Initialization

```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST http://129.212.237.102/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

# 2. Initialize payment
curl -X POST http://129.212.237.102/api/payments/init \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "gigId": "YOUR_GIG_ID_HERE"
  }'
```

---

## 📚 Related Endpoints

- **Get Gig:** `GET /api/gigs/:id`
- **Create Booking:** `POST /api/bookings`
- **Update Booking:** `PUT /api/bookings/:id`

---

## 🎯 Summary

**Correct Payment Init Endpoint:**
- ✅ Method: **POST**
- ✅ URL: `/api/payments/init` (not `/post/api/payments/init`)
- ✅ Full URL: `http://129.212.237.102/api/payments/init`
- ✅ Auth: Required (JWT token)
- ✅ Body: `{ "gigId": "...", "bookingId": "..." }`

**Never use:**
- ❌ GET method
- ❌ `/post/api/payments/init` (wrong URL)



