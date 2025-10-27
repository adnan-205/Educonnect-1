# 💰 EduConnect Wallet System

## Overview
Production-ready wallet system with automatic payment crediting, commission handling, and admin-approved withdrawals.

---

## ✅ What's Implemented

### Backend Components
- ✅ **Wallet Model** - Teacher wallet with balance tracking
- ✅ **WalletTransaction Model** - Complete transaction history
- ✅ **Wallet Service** - Business logic with atomic transactions
- ✅ **Wallet Controller** - Request handlers with validation
- ✅ **Wallet Routes** - RESTful API with role-based access
- ✅ **Payment Integration** - Auto-credit on successful payment
- ✅ **Commission System** - Configurable platform commission (default 10%)

### Features
- ✅ Automatic wallet creation for teachers
- ✅ Auto-credit after successful payment
- ✅ Commission deduction (configurable via env)
- ✅ Transaction history (credits + withdrawals)
- ✅ Withdrawal request system
- ✅ Admin approval/rejection workflow
- ✅ Wallet statistics for admins
- ✅ Atomic transactions (MongoDB sessions)
- ✅ Input validation (express-validator)
- ✅ Role-based access control

---

## 🚀 Quick Start

### 1. Configuration
Add to `.env`:
```env
PLATFORM_COMMISSION_RATE=0.10  # 10% commission
```

### 2. API Endpoints

#### Teacher Endpoints
```
GET    /api/wallet/balance              # Get wallet balance
GET    /api/wallet/transactions         # Get transaction history
POST   /api/wallet/withdraw             # Request withdrawal
```

#### Admin Endpoints
```
GET    /api/wallet/admin/withdrawals/pending    # View pending requests
PUT    /api/wallet/admin/withdrawals/:id/approve # Approve withdrawal
PUT    /api/wallet/admin/withdrawals/:id/reject  # Reject withdrawal
GET    /api/wallet/admin/stats                   # Wallet statistics
```

---

## 📊 How It Works

### Payment Flow
```
Student Payment (1000 BDT)
    ↓
Payment Success
    ↓
Commission Deducted (100 BDT @ 10%)
    ↓
Teacher Wallet Credited (900 BDT)
    ↓
Transaction Recorded (CREDIT, COMPLETED)
```

### Withdrawal Flow
```
Teacher Requests Withdrawal (500 BDT)
    ↓
System Validates (balance, no pending)
    ↓
Transaction Created (WITHDRAWAL, PENDING)
    ↓
Admin Reviews Request
    ↓
Approve → Balance Deducted, Status: COMPLETED
Reject → Balance Unchanged, Status: REJECTED
```

---

## 📁 File Structure

```
backend/src/
├── models/
│   ├── Wallet.ts                 ← Wallet schema
│   ├── WalletTransaction.ts      ← Transaction schema
│   └── User.ts                   ← Updated with wallet ref
├── services/
│   ├── wallet.service.ts         ← Business logic
│   └── payments.service.ts       ← Updated with wallet integration
├── controllers/
│   └── wallet.ts                 ← API handlers
├── routes/
│   └── wallet.ts                 ← API routes
└── server.ts                     ← Routes registered
```

---

## 🔐 Security

- **Authentication**: JWT token required
- **Authorization**: Role-based (teacher/admin)
- **Validation**: Input validation on all endpoints
- **Atomic Transactions**: MongoDB sessions prevent race conditions
- **Balance Protection**: Cannot go negative
- **Duplicate Prevention**: Only one pending withdrawal per teacher

---

## 📝 Example Usage

### Teacher: Check Balance
```javascript
const response = await fetch('/api/wallet/balance', {
  headers: { 'Authorization': `Bearer ${token}` }
});
// Returns: { balance, totalEarned, totalWithdrawn, ... }
```

### Teacher: Request Withdrawal
```javascript
await fetch('/api/wallet/withdraw', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 2000,
    withdrawalMethod: 'BANK_TRANSFER',
    withdrawalDetails: {
      accountNumber: '1234567890',
      accountName: 'John Doe',
      bankName: 'ABC Bank'
    }
  })
});
```

### Admin: Approve Withdrawal
```javascript
await fetch(`/api/wallet/admin/withdrawals/${id}/approve`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
```

---

## 📚 Documentation

- **Full Documentation**: `WALLET_SYSTEM_DOCUMENTATION.md`
- **Code Examples**: `WALLET_EXAMPLES.md`
- **API Reference**: See documentation for all endpoints

---

## 🧪 Testing

### Test Payment → Wallet Credit
1. Make a test payment via SSLCommerz
2. Payment succeeds
3. Check teacher wallet balance
4. Verify commission deducted correctly

### Test Withdrawal Flow
1. Teacher requests withdrawal
2. Admin views pending requests
3. Admin approves/rejects
4. Verify balance updated correctly

---

## 🎯 Key Features

### Automatic Wallet Management
- Wallet auto-created on first use
- No manual setup required
- Seamless integration with payments

### Commission Handling
- Configurable commission rate
- Automatic deduction on payment
- Transparent to teachers

### Admin Control
- Review all withdrawal requests
- Approve/reject with reasons
- View platform statistics

### Transaction History
- Complete audit trail
- Filter by type and status
- Pagination support

---

## ⚙️ Configuration Options

### Environment Variables
```env
PLATFORM_COMMISSION_RATE=0.10    # 10% = 0.10, 15% = 0.15
```

### Withdrawal Methods
- `BANK_TRANSFER` - Bank account
- `MOBILE_BANKING` - bKash, Nagad, etc.
- `PAYPAL` - PayPal account
- `OTHER` - Custom methods

---

## 🔧 Troubleshooting

### Wallet Not Showing
- Wallet is auto-created on first credit or balance check
- No manual action needed

### Commission Not Applied
- Check `PLATFORM_COMMISSION_RATE` in `.env`
- Default is 0.10 (10%) if not set

### Withdrawal Request Failed
- Check sufficient balance
- Ensure no pending withdrawal exists
- Verify withdrawal details are complete

### Admin Can't See Requests
- Verify admin role in JWT token
- Check authorization middleware

---

## 📈 Future Enhancements

Potential features to add:
- Scheduled auto-payouts
- Multi-currency support
- Withdrawal limits (min/max)
- Email/SMS notifications
- Detailed analytics dashboard
- Referral bonuses
- Escrow system for disputed payments

---

## 🤝 Support

For issues:
1. Check console logs for errors
2. Verify JWT token and user role
3. Review transaction history
4. Check MongoDB connection
5. Refer to full documentation

---

## 📄 License
Part of EduConnect MERN Stack Application

---

## 🎉 Summary

You now have a **complete, production-ready wallet system** with:
- ✅ Automatic payment crediting
- ✅ Commission handling
- ✅ Withdrawal management
- ✅ Admin approval workflow
- ✅ Transaction history
- ✅ Security & validation
- ✅ Comprehensive documentation

**Ready to use!** Just restart your server and start testing.
