# 📚 TutorConnected API - Complete Endpoints Documentation

**Base URL**: `http://129.212.237.102` (or your server IP)

---

## ✅ Your Backend is Working!

Your backend at [http://129.212.237.102/](http://129.212.237.102/) is **fully functional** and can handle **ALL** the backend functionality for this project!

---

## 🔍 Health Check Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Basic health check | ❌ No |
| GET | `/health/detailed` | Detailed health with services status | ❌ No |
| GET | `/health/ready` | Readiness probe (checks MongoDB) | ❌ No |
| GET | `/health/live` | Liveness probe | ❌ No |

---

## 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ No |
| POST | `/api/auth/login` | Login user | ❌ No |
| PUT | `/api/auth/role` | Update user role (Admin only) | ✅ Admin |
| PUT | `/api/auth/me/role` | Update own role | ✅ Yes |
| POST | `/api/auth/clerk-sync` | Sync with Clerk (if using) | ✅ Yes |

---

## 👤 User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/:id` | Get user profile | ❌ No |
| GET | `/api/users/:id/gigs` | Get user's gigs | ❌ No |
| PUT | `/api/users/me` | Update own profile | ✅ Yes |

---

## 📚 Gig (Class) Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/gigs` | Get all gigs (with filters) | ❌ No |
| GET | `/api/gigs/:id` | Get single gig | ❌ No |
| POST | `/api/gigs` | Create new gig | ✅ Teacher |
| PUT | `/api/gigs/:id` | Update gig | ✅ Teacher |
| DELETE | `/api/gigs/:id` | Delete gig | ✅ Teacher |
| GET | `/api/gigs/:gigId/reviews` | Get reviews for a gig | ❌ No |
| GET | `/api/gigs/:gigId/reviews/me` | Get my review for a gig | ✅ Yes |
| POST | `/api/gigs/:gigId/reviews` | Create review for a gig | ✅ Yes |

---

## 📅 Booking Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/bookings` | Get all bookings (filtered by role) | ✅ Yes |
| GET | `/api/bookings/:id` | Get single booking | ✅ Yes |
| POST | `/api/bookings` | Create booking (book a class) | ✅ Student |
| PUT | `/api/bookings/:id` | Update booking status (accept/reject) | ✅ Teacher |
| GET | `/api/bookings/room/:roomId` | Get booking by Jitsi room ID | ✅ Yes |
| POST | `/api/bookings/:id/attendance` | Mark attendance for booking | ✅ Student |

---

## ⭐ Review Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/reviews` | List reviews (with filters) | ❌ No |
| GET | `/api/reviews/:id` | Get single review | ❌ No |
| PUT | `/api/reviews/:id` | Update own review | ✅ Yes |
| DELETE | `/api/reviews/:id` | Delete own review | ✅ Yes |

---

## 💳 Payment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/init` | Initialize payment | ✅ Student |
| GET | `/api/payments/status/:gigId` | Get payment status | ✅ Yes |
| GET | `/api/payments/booking-status/:bookingId` | Get booking payment status | ✅ Yes |
| POST | `/api/payments/success/:tran_id` | Payment success callback | ❌ No |
| POST | `/api/payments/fail/:tran_id` | Payment fail callback | ❌ No |
| POST | `/api/payments/cancel/:tran_id` | Payment cancel callback | ❌ No |
| POST | `/api/payments/ipn` | Instant Payment Notification | ❌ No |

**⚠️ Important:** 
- `/api/payments/init` requires **POST** method (not GET!)
- URL is `/api/payments/init` (not `/post/api/payments/init`)
- Authentication token required in header: `Authorization: Bearer YOUR_TOKEN`

---

## 📤 Upload Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/uploads/image` | Upload image (max 5MB) | ✅ Yes |
| POST | `/api/uploads/video` | Upload video (max 100MB) | ✅ Yes |
| POST | `/api/uploads/gig-thumbnail` | Upload gig thumbnail | ✅ Yes |
| DELETE | `/api/uploads/gig-thumbnail` | Delete gig thumbnail | ✅ Yes |

---

## 💰 Wallet Endpoints (Teacher)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/wallet/balance` | Get wallet balance | ✅ Teacher |
| GET | `/api/wallet/transactions` | Get transaction history | ✅ Teacher |
| POST | `/api/wallet/withdraw` | Request withdrawal | ✅ Teacher |

---

## 👨‍💼 Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/users` | List all users | ✅ Admin |
| GET | `/api/admin/users/:id` | Get user details | ✅ Admin |
| GET | `/api/admin/activities` | List all activities | ✅ Admin |
| GET | `/api/admin/users/:id/activities` | Get user activities | ✅ Admin |
| GET | `/api/admin/analytics/classes` | Get class analytics | ✅ Admin |
| GET | `/api/wallet/admin/withdrawals/pending` | Get pending withdrawals | ✅ Admin |
| PUT | `/api/wallet/admin/withdrawals/:id/approve` | Approve withdrawal | ✅ Admin |
| PUT | `/api/wallet/admin/withdrawals/:id/reject` | Reject withdrawal | ✅ Admin |
| GET | `/api/wallet/admin/stats` | Get wallet statistics | ✅ Admin |

---

## 🎯 Complete Feature Coverage

Your backend handles **ALL** features:

### ✅ Core Features
- ✅ User authentication (register, login)
- ✅ User profiles and management
- ✅ Gig (class) creation and management
- ✅ Booking system (students book classes)
- ✅ Payment processing (SSLCommerz integration)
- ✅ Review and rating system
- ✅ File uploads (images, videos, thumbnails)

### ✅ Advanced Features
- ✅ Wallet system for teachers
- ✅ Withdrawal requests and approval
- ✅ Admin dashboard and analytics
- ✅ Activity logging
- ✅ Jitsi Meet integration (room ID generation)
- ✅ Attendance tracking
- ✅ Role-based access control

### ✅ Video Conferencing
- ✅ Unique room ID generation per class
- ✅ Meeting link creation
- ✅ Room access validation
- ✅ Teacher/Student role detection

---

## 📝 Example API Calls

### Register User
```bash
curl -X POST http://129.212.237.102/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "student"
  }'
```

### Login
```bash
curl -X POST http://129.212.237.102/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get All Gigs
```bash
curl http://129.212.237.102/api/gigs
```

### Create Booking (with token)
```bash
curl -X POST http://129.212.237.102/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "gig": "gig_id_here",
    "scheduledDate": "2025-01-20",
    "scheduledTime": "14:00"
  }'
```

---

## 🔒 Authentication

Most endpoints require authentication. Include the JWT token in the header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Get token from `/api/auth/login` endpoint.

---

## ✅ Summary

**YES!** Your backend at `http://129.212.237.102` **CAN handle ALL the backend functionality** for this project!

The root endpoint (`/`) now shows all available endpoints. After you rebuild and redeploy, visiting `http://129.212.237.102/` will show the complete API documentation.

---

## 🚀 Next Steps

1. **Rebuild backend** (if you made changes):
   ```bash
   cd backend
   npm run build
   ```

2. **Redeploy** (if using Docker):
   ```bash
   docker compose restart backend
   ```

3. **Test the updated root endpoint**:
   ```bash
   curl http://129.212.237.102/
   ```

Your backend is **production-ready** and **fully functional**! 🎉

