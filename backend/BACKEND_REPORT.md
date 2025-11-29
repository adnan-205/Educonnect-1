# EduConnect Backend Report

Version: current codebase snapshot

## Overview

- **Stack**: Node.js, Express, TypeScript, MongoDB (Mongoose)
- **Auth**: JWT (access token via `Authorization: Bearer <token>`)
- **Storage**: Cloudinary for images/videos (via upload streams)
- **Payments**: SSLCommerz gateway integration + IPN validation
- **Video**: Jitsi Meet room links auto-generated on booking acceptance
- **Security**: Helmet, robust CORS allowlist, rate limiting, NoSQL injection sanitization
- **Observability**: Request logger, centralized error handler, Activity logs, Payment logs

## Entry point and App Setup

- File: `src/server.ts`
- Loads `.env`, builds Express app, configures security and infra middleware:
  - `helmet`, `compression`, custom sanitizer to remove `$` and `.` from body/query/params
  - CORS allowlist from env with dev and Render/SSLCommerz patterns
  - `express-rate-limit` with dev shortcuts and health-check skip
  - Request logging (`middleware/logger.ts`) and centralized error handler (`middleware/error.ts`)
- Routes mounted:
  - `/health`, `/api/health` → health checks
  - `/api/auth`, `/api/gigs`, `/api/bookings`, `/api/users`, `/api/uploads`, `/api/payments`, `/api/reviews`, `/api/wallet`, `/api/admin`
- MongoDB connection with tuned pool and timeouts; graceful shutdown on SIGINT
- Root `GET /` returns quick endpoint index

## Middleware

- `middleware/auth.ts`
  - `protect`: verifies JWT (`JWT_SECRET`), attaches `req.user`
  - `authorize(...roles)`: role-based guard for routes
- `middleware/error.ts`: robust error handler with friendly messages (Validation, JWT, duplicate key, cast, rate-limit) and structured JSON
- `middleware/validation.ts`: request validators (e.g., `validateBookingCreation`) used by routes
- `middleware/logger.ts`: basic per-request logging

## Data Models (Mongoose)

- `User`
  - Fields: `name`, `email`, `password` (bcrypt), `role: 'student'|'teacher'|'admin'`
  - Onboarding: `isOnboarded`, `marketingSource`
  - Profile: `avatar`, `coverImage`, `headline`, `phone`, `location`, `profile` (bio, experiences, education, work, demoVideos, skills, languages, subjects, hourlyRate, availability, timezone)
  - Teacher rating aggregates: `teacherRatingSum`, `teacherReviewsCount`, `teacherRatingAverage`
  - `wallet` ref
- `Gig`
  - `teacher`, `title`, `description`, `price`, `category`, `duration`
  - Rating snapshot: `averageRating`, `reviewsCount`
  - Thumbnail: `thumbnailUrl`, `thumbnailPublicId`
  - Availability: days, times
- `Booking`
  - `student`, `gig`, `status: pending|accepted|rejected|completed`
  - Schedule: `scheduledDate`, `scheduledTime`, `scheduledAt` (UTC canonical), `timeZone`
  - Meeting: `meetingLink`, `meetingRoomId`, `meetingPassword`
  - Attendance: `attended`, `attendedAt`
  - Review visibility: `reviewVisibility`
- `Payment`
  - `gigId`, `studentId`, `teacherId`, `bookingId?`, `amount`, `status: PENDING|SUCCESS|FAILED`, `transactionId`, `statusHistory[]`
- `Review`
  - `gig`, `teacher`, `student`, `booking?`, `rating 1..5`, `title?`, `comment?`
  - Unique index: `(student, gig)`
- `Wallet`
  - `teacher` (unique), `balance`, `totalEarned`, `totalWithdrawn`, `currency`
- `WalletTransaction`
  - `wallet`, `teacher`, `type: CREDIT|WITHDRAWAL`, `amount`, `commission`, `netAmount`, `status: PENDING|COMPLETED|REJECTED|CANCELLED`, `description`
  - Credit refs: `payment`, `booking`
  - Withdrawal: `withdrawalMethod`, `withdrawalDetails{...}`, `processedBy`, `processedAt`, `rejectionReason`
- `Activity`
  - `user`, `action`, `targetType?`, `targetId?`, `metadata?`, `ip?`, `userAgent?`

## Auth and User Flows

- JWT issued on register/login/clerk-sync
- `protect` required for most mutating endpoints
- `authorize('teacher'|'student'|'admin')` on sensitive actions

### Auth API

- POST `/api/auth/register` → { name, email, password, role }
- POST `/api/auth/login` → { email, password }
- PUT `/api/auth/update-role` [admin] → { email, role }
- POST `/api/auth/clerk-sync` → { email, name? } upsert + issue JWT (supports allowlisted `ADMIN_EMAILS`)

### Users API

- GET `/api/users/:id` → Public profile
- GET `/api/users/:id/gigs` → Teacher gigs
- PUT `/api/users/me` [auth] → Update own top-level + `profile.*`, onboarding fields

## Gigs and Reviews

### Gigs API

- GET `/api/gigs` → List
- GET `/api/gigs/:id` → Detail (+ isPaid for current student)
- POST `/api/gigs` [teacher] → Create
- PUT `/api/gigs/:id` [teacher owner] → Update
- DELETE `/api/gigs/:id` [teacher owner] → Delete

### Reviews API

- GET `/api/reviews?gig=&teacher=&student=&page=&limit=&sort=`
- GET `/api/reviews/:id`
- GET `/api/gigs/:gigId/reviews`
- GET `/api/gigs/:gigId/reviews/me` [auth] → Student’s own review if exists
- POST `/api/gigs/:gigId/reviews` [student] → Requires completed booking for that gig
- PUT `/api/reviews/:id` [owner]
- DELETE `/api/reviews/:id` [owner or admin]
- Ratings rollup:
  - Gig: aggregation per gig updates `averageRating`, `reviewsCount`
  - Teacher: incremental fields on `User` for aggregate averages

## Bookings and Classes

### Booking Rules

- Student creates booking for a gig with schedule
- Teacher updates booking status (accept/reject/complete)
- On accept: system generates secure Jitsi room id + link (meet.jit.si) and optional password
- Attendance:
  - Only student owner can mark attended if status is `accepted`
- Join rules (GET `/api/bookings/room/:roomId`):
  - Only the booking’s student or the gig’s teacher
  - Status must be `accepted`
  - Time window: opens 15 min before start; closes 60 min after end
  - Student must have SUCCESS payment for that booking

### Bookings API

- GET `/api/bookings` [auth] → Role-based list; `?status=` filter
- GET `/api/bookings/:id` [auth]
- POST `/api/bookings` [student] → Validate via `validateBookingCreation`
- PUT `/api/bookings/:id` [teacher owner] → Update status; on `accepted` generates meeting
- GET `/api/bookings/room/:roomId` [auth] → Access validation for meeting
- POST `/api/bookings/:id/attendance` [student owner]

## Payments and Wallet

### Payments Flow (SSLCommerz)

- POST `/api/payments/init` [auth]
  - Creates `Payment` in PENDING and returns `GatewayPageURL`
- Gateway redirects:
  - POST `/api/payments/success/:tran_id`
  - POST `/api/payments/fail/:tran_id`
  - POST `/api/payments/cancel/:tran_id`
- IPN: POST `/api/payments/ipn` (server-to-server), validates transaction (`val_id`) with SSLCommerz validator API
- Status checks:
  - GET `/api/payments/status/:gigId` [auth student]
  - GET `/api/payments/booking-status/:bookingId` [auth teacher|student]

### Wallet Logic

- Commission: `PLATFORM_COMMISSION_RATE` (default 10%) deducted on credit
- On payment SUCCESS → `wallet.service.creditWallet`:
  - Create CREDIT `WalletTransaction` (COMPLETED)
  - Update `Wallet` balance and totals
- Withdrawals (Teacher):
  - POST `/api/wallet/withdraw` [teacher] → PENDING WITHDRAWAL; only one pending at a time; validates balance
  - GET `/api/wallet/balance` [teacher]
  - GET `/api/wallet/transactions` [teacher] → filters: `type`, `status`, paging
- Admin wallet actions:
  - GET `/api/wallet/admin/withdrawals/pending` [admin]
  - PUT `/api/wallet/admin/withdrawals/:transactionId/approve` [admin]
  - PUT `/api/wallet/admin/withdrawals/:transactionId/reject` [admin] with `reason`
  - GET `/api/wallet/admin/stats` [admin]

## Uploads (Cloudinary)

- Multer `memoryStorage`
- POST `/api/uploads/image` [auth] → image types; size ≤ 5MB; folder via `?folder=` (default `educonnect/images`)
- POST `/api/uploads/video` [auth] → video types; size ≤ 100MB; default `educonnect/videos`
- Gig thumbnail helpers:
  - POST `/api/uploads/gig-thumbnail?gigId=` [auth] teacher owner → uploads to `educonnect/gigs/thumbnails`, links to Gig, cleans up old public_id
  - DELETE `/api/uploads/gig-thumbnail?gigId=` [auth] teacher owner → removes db refs and attempts cloud delete

## Admin and Analytics

- Users management:
  - GET `/api/admin/users` [admin] → filters: `q`, `role`, `isOnboarded`, paging
  - GET `/api/admin/users/:id` [admin]
- Activity log views:
  - GET `/api/admin/activities` [admin] → filters: `userId`, `action`, `targetType`, `from`, `to`
  - GET `/api/admin/users/:id/activities` [admin]
- Class analytics:
  - GET `/api/admin/analytics/classes?from=&to=&teacherId=&status=` [admin]
  - Returns summary, daily timeseries, top teachers, and revenue from successful payments in range

## Health Checks

- GET `/health` → basic status
- GET `/health/detailed` → DB and memory checks; 503 on degraded
- GET `/health/ready` and `/health/live` → readiness/liveness probes

## Services and Repositories

- `services/payments.service.ts`: orchestrates SSLCommerz init, success/fail/cancel, IPN; credits wallet on success
- `services/wallet.service.ts`: wallet lifecycle (create, credit, request withdrawal)
- `repositories/PaymentRepository.ts`: payment persistence helpers
- `repositories/BookingRepository.ts`: booking status updates (used by payments)

## Validation and Error Handling

- Validators in `middleware/validation.ts` (e.g., `validateBookingCreation`)
- Error schema (example): `{ success: false, error|message, timestamp, path, method [, stack in dev] }`

## Environment Variables (see `backend/env.example`)

- Server: `PORT`, `NODE_ENV`, `BASE_URL`, `FRONTEND_URL`
- DB: `MONGODB_URI`, `DB_MAX_POOL_SIZE`, `DB_MIN_POOL_SIZE`, `DB_MAX_IDLE_TIME_MS`
- JWT: `JWT_SECRET`, `JWT_EXPIRE`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRE`
- Security: `CORS_ORIGINS`, `RATE_LIMIT_*`, `BCRYPT_ROUNDS`, `TRUST_PROXY`, `SECURE_COOKIES`
- Cloudinary: `CLOUDINARY_*`
- Email (optional): SMTP\_\* vars
- Monitoring: `SENTRY_DSN`, `LOG_LEVEL`
- Payments: `SSL_STORE_ID`, `SSL_STORE_PASS`, `SSL_IS_LIVE`
- Wallet: `PLATFORM_COMMISSION_RATE`
- Jitsi: `MEETING_PASSWORD_ENABLED`
- Admin: `ADMIN_EMAILS`

## Setup and Run

1. Copy `backend/env.example` to `backend/.env` and fill values
2. Install deps: `npm install`
3. Start dev server: `npm run dev` (uses ts-node or equivalent)
4. Production build: `npm run build` → run from `dist` with `npm start`

## Security Notes

- JWT secrets must be strong and kept private
- CORS restricted by env + dev allowances; payment domains are whitelisted
- Request sanitization removes NoSQL operator keys; avoid using dot-path user inputs directly
- Rate limiting active by default (skipped in dev)

## Key Business Rules Summary

- Students must pay successfully to join a class; access is time-windowed
- Teachers can accept/reject; acceptance auto-generates Jitsi room (meet.jit.si) link
- Reviews are allowed only after completion; one review per gig per student; updates affect aggregates
- Wallet credits on successful payment minus commission; withdrawals are reviewed by admin

## Useful Test/Debug Files

- `test-wallet.http`: sample HTTP requests for wallet endpoints
- `WALLET_*.md`: architecture, checklists, examples, and quickstarts for the wallet subsystem

---

This report reflects the current codebase under `backend/src` and env examples. For any API changes, update both controller/route docs here and the root index in `server.ts`.
