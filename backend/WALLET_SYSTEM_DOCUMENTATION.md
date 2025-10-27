# EduConnect Wallet System Documentation

## Overview
Complete wallet system for EduConnect that automatically credits teachers after successful payments, tracks transaction history, and enables admin-approved withdrawals.

## Features
- ✅ Automatic wallet crediting after successful payment
- ✅ Platform commission deduction (configurable)
- ✅ Transaction history tracking (credits & withdrawals)
- ✅ Teacher withdrawal requests
- ✅ Admin approval/rejection workflow
- ✅ Wallet balance and statistics
- ✅ Role-based access control
- ✅ Atomic transactions for data consistency

---

## Configuration

### Environment Variables
Add to your `.env` file:

```env
# Wallet Configuration
PLATFORM_COMMISSION_RATE=0.10  # 10% commission (0.10 = 10%)
```

**Default:** 10% commission if not specified

---

## Database Models

### 1. Wallet Model
Located: `backend/src/models/Wallet.ts`

**Fields:**
- `teacher` - Reference to User (unique)
- `balance` - Current available balance
- `totalEarned` - Lifetime earnings
- `totalWithdrawn` - Total withdrawn amount
- `currency` - Currency code (default: BDT)

### 2. WalletTransaction Model
Located: `backend/src/models/WalletTransaction.ts`

**Fields:**
- `wallet` - Reference to Wallet
- `teacher` - Reference to User
- `type` - CREDIT | WITHDRAWAL
- `amount` - Original amount
- `commission` - Platform commission (for CREDIT)
- `netAmount` - Amount after commission
- `status` - PENDING | COMPLETED | REJECTED | CANCELLED
- `description` - Transaction description
- `payment` - Reference to Payment (for CREDIT)
- `booking` - Reference to Booking (for CREDIT)
- `withdrawalMethod` - BANK_TRANSFER | MOBILE_BANKING | PAYPAL | OTHER
- `withdrawalDetails` - Object with account details
- `processedBy` - Admin who processed (for WITHDRAWAL)
- `processedAt` - Processing timestamp
- `rejectionReason` - Reason for rejection

### 3. User Model Update
Added field:
- `wallet` - Reference to Wallet (for teachers)

---

## API Endpoints

### Teacher Endpoints

#### 1. Get Wallet Balance
```http
GET /api/wallet/balance
Authorization: Bearer <teacher_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 4500,
    "totalEarned": 5000,
    "totalWithdrawn": 500,
    "pendingWithdrawals": 0,
    "availableForWithdrawal": 4500,
    "currency": "BDT"
  }
}
```

#### 2. Get Transaction History
```http
GET /api/wallet/transactions?type=CREDIT&status=COMPLETED&limit=50&skip=0
Authorization: Bearer <teacher_token>
```

**Query Parameters:**
- `type` (optional): CREDIT | WITHDRAWAL
- `status` (optional): PENDING | COMPLETED | REJECTED | CANCELLED
- `limit` (optional): Number of records (default: 50)
- `skip` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "type": "CREDIT",
      "amount": 1000,
      "commission": 100,
      "netAmount": 900,
      "status": "COMPLETED",
      "description": "Payment received for booking",
      "createdAt": "2025-01-15T10:30:00Z",
      "payment": { ... },
      "booking": { ... }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "skip": 0,
    "hasMore": false
  }
}
```

#### 3. Request Withdrawal
```http
POST /api/wallet/withdraw
Authorization: Bearer <teacher_token>
Content-Type: application/json

{
  "amount": 2000,
  "withdrawalMethod": "BANK_TRANSFER",
  "withdrawalDetails": {
    "accountNumber": "1234567890",
    "accountName": "John Doe",
    "bankName": "ABC Bank",
    "branchName": "Main Branch",
    "routingNumber": "123456789"
  }
}
```

**Withdrawal Methods:**
- `BANK_TRANSFER` - Bank account transfer
- `MOBILE_BANKING` - bKash, Nagad, etc.
- `PAYPAL` - PayPal account
- `OTHER` - Other methods

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal request submitted successfully. Admin will review it shortly.",
  "data": {
    "_id": "...",
    "type": "WITHDRAWAL",
    "amount": 2000,
    "status": "PENDING",
    "withdrawalMethod": "BANK_TRANSFER",
    "withdrawalDetails": { ... },
    "createdAt": "2025-01-15T11:00:00Z"
  }
}
```

**Validation:**
- Amount must be positive
- Sufficient balance required
- Only one pending withdrawal allowed at a time

---

### Admin Endpoints

#### 4. Get Pending Withdrawals
```http
GET /api/wallet/admin/withdrawals/pending?limit=50&skip=0
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "teacher": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+8801711111111"
      },
      "wallet": {
        "_id": "...",
        "balance": 5000
      },
      "amount": 2000,
      "withdrawalMethod": "BANK_TRANSFER",
      "withdrawalDetails": { ... },
      "status": "PENDING",
      "createdAt": "2025-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 50,
    "skip": 0,
    "hasMore": false
  }
}
```

#### 5. Approve Withdrawal
```http
PUT /api/wallet/admin/withdrawals/:transactionId/approve
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal approved successfully",
  "data": {
    "_id": "...",
    "status": "COMPLETED",
    "processedBy": "...",
    "processedAt": "2025-01-15T12:00:00Z"
  }
}
```

**Actions:**
- Updates transaction status to COMPLETED
- Deducts amount from wallet balance
- Updates totalWithdrawn
- Records admin and timestamp

#### 6. Reject Withdrawal
```http
PUT /api/wallet/admin/withdrawals/:transactionId/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Insufficient verification documents provided"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal rejected",
  "data": {
    "_id": "...",
    "status": "REJECTED",
    "rejectionReason": "Insufficient verification documents provided",
    "processedBy": "...",
    "processedAt": "2025-01-15T12:00:00Z"
  }
}
```

#### 7. Get Wallet Statistics
```http
GET /api/wallet/admin/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBalance": 125000,
    "totalEarned": 500000,
    "totalWithdrawn": 375000,
    "teacherCount": 50,
    "pendingWithdrawals": {
      "count": 5,
      "amount": 15000
    }
  }
}
```

---

## Workflow

### Payment to Wallet Credit Flow

1. **Student makes payment** → SSLCommerz gateway
2. **Payment succeeds** → `payments.service.ts` → `handleSuccess()`
3. **Wallet credited automatically:**
   - Calculate commission: `amount × PLATFORM_COMMISSION_RATE`
   - Net amount: `amount - commission`
   - Create CREDIT transaction (COMPLETED)
   - Update wallet balance and totalEarned
4. **Teacher sees updated balance** in wallet

**Example:**
- Student pays: 1000 BDT
- Commission (10%): 100 BDT
- Teacher receives: 900 BDT

### Withdrawal Request Flow

1. **Teacher requests withdrawal** → POST `/api/wallet/withdraw`
2. **System validates:**
   - Sufficient balance?
   - No pending withdrawals?
3. **Creates PENDING withdrawal transaction**
4. **Admin reviews** → GET `/api/wallet/admin/withdrawals/pending`
5. **Admin approves/rejects:**
   - **Approve:** Deduct from balance, mark COMPLETED
   - **Reject:** Mark REJECTED with reason
6. **Teacher sees updated status** in transaction history

---

## Code Structure

```
backend/src/
├── models/
│   ├── Wallet.ts                    # Wallet schema
│   ├── WalletTransaction.ts         # Transaction schema
│   └── User.ts                      # Updated with wallet reference
├── services/
│   ├── wallet.service.ts            # Business logic
│   └── payments.service.ts          # Updated with wallet integration
├── controllers/
│   └── wallet.ts                    # Request handlers
├── routes/
│   └── wallet.ts                    # API routes
└── server.ts                        # Updated with wallet routes
```

---

## Security Features

### Role-Based Access Control
- **Teachers:** Can only access their own wallet
- **Admins:** Can manage all withdrawals and view statistics
- Middleware: `protect` + `authorize('teacher')` or `authorize('admin')`

### Data Validation
- Input validation using `express-validator`
- Amount validation (positive numbers)
- Withdrawal method validation
- Rejection reason validation (min 10 characters)

### Transaction Safety
- Mongoose sessions for atomic operations
- Balance cannot go negative (schema validation)
- Prevents duplicate pending withdrawals
- Validates sufficient balance before withdrawal

---

## Testing

### Test Scenarios

#### 1. Test Wallet Credit
```bash
# Make a test payment and verify wallet credit
curl -X POST http://localhost:5000/api/payments/init \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{"gigId": "...", "bookingId": "..."}'

# After payment success, check teacher wallet
curl -X GET http://localhost:5000/api/wallet/balance \
  -H "Authorization: Bearer <teacher_token>"
```

#### 2. Test Withdrawal Request
```bash
curl -X POST http://localhost:5000/api/wallet/withdraw \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "withdrawalMethod": "MOBILE_BANKING",
    "withdrawalDetails": {
      "mobileNumber": "+8801711111111",
      "accountName": "John Doe",
      "provider": "bKash"
    }
  }'
```

#### 3. Test Admin Approval
```bash
# Get pending withdrawals
curl -X GET http://localhost:5000/api/wallet/admin/withdrawals/pending \
  -H "Authorization: Bearer <admin_token>"

# Approve withdrawal
curl -X PUT http://localhost:5000/api/wallet/admin/withdrawals/<transactionId>/approve \
  -H "Authorization: Bearer <admin_token>"
```

---

## Error Handling

### Common Errors

**Insufficient Balance:**
```json
{
  "success": false,
  "message": "Insufficient balance. Available: 500, Requested: 1000"
}
```

**Pending Withdrawal Exists:**
```json
{
  "success": false,
  "message": "You already have a pending withdrawal request"
}
```

**Invalid Transaction Status:**
```json
{
  "success": false,
  "message": "Cannot approve transaction with status: COMPLETED"
}
```

**Unauthorized Access:**
```json
{
  "success": false,
  "message": "User role student is not authorized to access this route"
}
```

---

## Database Indexes

Optimized queries with indexes:
- `Wallet`: `teacher` (unique)
- `WalletTransaction`: 
  - `wallet`, `teacher`, `type`, `status`
  - Compound: `teacher + type + status`
  - Compound: `wallet + createdAt`
  - Compound: `status + type`

---

## Future Enhancements

### Potential Features
1. **Scheduled Payouts:** Auto-approve withdrawals on specific dates
2. **Withdrawal Limits:** Min/max withdrawal amounts
3. **Fee Structure:** Different commission rates per teacher tier
4. **Multi-Currency:** Support for multiple currencies
5. **Payment Methods:** Integrate with Stripe, PayPal for direct payouts
6. **Notifications:** Email/SMS alerts for wallet events
7. **Analytics:** Detailed earning reports and charts
8. **Referral Bonuses:** Credit wallet for referrals
9. **Escrow System:** Hold funds until class completion

---

## Troubleshooting

### Wallet Not Created
**Issue:** Teacher wallet doesn't exist  
**Solution:** Wallet is auto-created on first credit or balance check

### Commission Not Deducted
**Issue:** Full amount credited to wallet  
**Solution:** Check `PLATFORM_COMMISSION_RATE` in `.env`

### Withdrawal Not Appearing
**Issue:** Withdrawal request not showing in admin panel  
**Solution:** Verify transaction status is PENDING and type is WITHDRAWAL

### Balance Mismatch
**Issue:** Wallet balance doesn't match transactions  
**Solution:** Check for failed transactions or manual database edits

---

## Support

For issues or questions:
1. Check error logs in console
2. Verify authentication tokens
3. Confirm user roles (teacher/admin)
4. Review transaction history for status
5. Check MongoDB connection and indexes

---

## License
Part of EduConnect MERN Stack Application
