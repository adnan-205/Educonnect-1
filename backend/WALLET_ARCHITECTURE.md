# 🏗️ Wallet System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        EduConnect Platform                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐              │
│  │ Student  │      │ Teacher  │      │  Admin   │              │
│  └────┬─────┘      └────┬─────┘      └────┬─────┘              │
│       │                 │                  │                     │
│       │ Makes Payment   │ Views Wallet     │ Approves           │
│       │                 │ Requests         │ Withdrawals        │
│       ▼                 ▼ Withdrawal       ▼                     │
│  ┌─────────────────────────────────────────────────┐            │
│  │              API Layer (Express)                 │            │
│  │  /api/payments/*    /api/wallet/*               │            │
│  └────────────────┬────────────────────────────────┘            │
│                   │                                              │
│                   ▼                                              │
│  ┌─────────────────────────────────────────────────┐            │
│  │           Business Logic (Services)              │            │
│  │  - payments.service.ts                          │            │
│  │  - wallet.service.ts                            │            │
│  └────────────────┬────────────────────────────────┘            │
│                   │                                              │
│                   ▼                                              │
│  ┌─────────────────────────────────────────────────┐            │
│  │         Database Layer (MongoDB)                 │            │
│  │  - Payment Collection                           │            │
│  │  - Wallet Collection                            │            │
│  │  - WalletTransaction Collection                 │            │
│  │  - User Collection                              │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Payment to Wallet Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Payment Success Flow                          │
└─────────────────────────────────────────────────────────────────┘

    Student                SSLCommerz           Backend                Database
       │                       │                   │                      │
       │  1. Initiates         │                   │                      │
       │  Payment (1000 BDT)   │                   │                      │
       ├──────────────────────>│                   │                      │
       │                       │                   │                      │
       │  2. Redirects to      │                   │                      │
       │  Payment Gateway      │                   │                      │
       │<──────────────────────┤                   │                      │
       │                       │                   │                      │
       │  3. Completes         │                   │                      │
       │  Payment              │                   │                      │
       ├──────────────────────>│                   │                      │
       │                       │                   │                      │
       │                       │  4. Success       │                      │
       │                       │  Callback         │                      │
       │                       ├──────────────────>│                      │
       │                       │                   │                      │
       │                       │                   │  5. Mark Payment     │
       │                       │                   │  SUCCESS             │
       │                       │                   ├─────────────────────>│
       │                       │                   │                      │
       │                       │                   │  6. Calculate        │
       │                       │                   │  Commission          │
       │                       │                   │  (100 BDT @ 10%)     │
       │                       │                   │                      │
       │                       │                   │  7. Credit Wallet    │
       │                       │                   │  (900 BDT)           │
       │                       │                   ├─────────────────────>│
       │                       │                   │                      │
       │                       │                   │  8. Create CREDIT    │
       │                       │                   │  Transaction         │
       │                       │                   ├─────────────────────>│
       │                       │                   │                      │
       │  9. Redirect to       │                   │                      │
       │  Success Page         │<──────────────────┤                      │
       │<──────────────────────┤                   │                      │
       │                       │                   │                      │
```

**Result:**
- Payment: 1000 BDT (SUCCESS)
- Commission: 100 BDT (Platform)
- Teacher Wallet: +900 BDT
- Transaction: CREDIT, COMPLETED

---

## Withdrawal Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  Withdrawal Request Flow                         │
└─────────────────────────────────────────────────────────────────┘

    Teacher              Backend                Admin               Database
       │                    │                     │                     │
       │  1. Request        │                     │                     │
       │  Withdrawal        │                     │                     │
       │  (500 BDT)         │                     │                     │
       ├───────────────────>│                     │                     │
       │                    │                     │                     │
       │                    │  2. Validate        │                     │
       │                    │  - Balance >= 500?  │                     │
       │                    │  - No pending?      │                     │
       │                    │                     │                     │
       │                    │  3. Create          │                     │
       │                    │  WITHDRAWAL         │                     │
       │                    │  Transaction        │                     │
       │                    │  (PENDING)          │                     │
       │                    ├────────────────────────────────────────>│
       │                    │                     │                     │
       │  4. Success        │                     │                     │
       │  Response          │                     │                     │
       │<───────────────────┤                     │                     │
       │                    │                     │                     │
       │                    │  5. Admin Views     │                     │
       │                    │  Pending Requests   │                     │
       │                    │<────────────────────┤                     │
       │                    │                     │                     │
       │                    │  6. List Pending    │                     │
       │                    ├────────────────────>│                     │
       │                    │                     │                     │
       │                    │  7. Admin Decides   │                     │
       │                    │  (Approve/Reject)   │                     │
       │                    │<────────────────────┤                     │
       │                    │                     │                     │
       │                    │  8. Update Status   │                     │
       │                    │  Deduct Balance     │                     │
       │                    ├────────────────────────────────────────>│
       │                    │                     │                     │
       │  9. Notification   │                     │                     │
       │  (Optional)        │                     │                     │
       │<───────────────────┤                     │                     │
       │                    │                     │                     │
```

**Approval Result:**
- Transaction: WITHDRAWAL, COMPLETED
- Wallet Balance: -500 BDT
- Total Withdrawn: +500 BDT

**Rejection Result:**
- Transaction: WITHDRAWAL, REJECTED
- Wallet Balance: Unchanged
- Rejection Reason: Stored

---

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    Database Collections                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│     User     │
├──────────────┤
│ _id          │◄─────────┐
│ name         │          │
│ email        │          │
│ role         │          │
│ wallet   ────┼──┐       │
└──────────────┘  │       │
                  │       │
                  ▼       │
         ┌──────────────┐ │
         │    Wallet    │ │
         ├──────────────┤ │
         │ _id          │ │
         │ teacher  ────┼─┘
         │ balance      │
         │ totalEarned  │
         │ totalWithdrawn│
         └──────────────┘
                  ▲
                  │
                  │
         ┌────────┴──────────────┐
         │                       │
┌────────┴──────────┐   ┌────────┴──────────┐
│ WalletTransaction │   │     Payment       │
├───────────────────┤   ├───────────────────┤
│ _id               │   │ _id               │
│ wallet        ────┤   │ teacherId         │
│ teacher           │   │ studentId         │
│ type              │   │ amount            │
│ amount            │   │ status            │
│ commission        │   │ transactionId     │
│ netAmount         │   └───────────────────┘
│ status            │            │
│ payment       ────┼────────────┘
│ booking           │
│ withdrawalMethod  │
│ withdrawalDetails │
│ processedBy       │
└───────────────────┘
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Backend Components                           │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                         Routes Layer                            │
│  /api/wallet/balance                    (Teacher)              │
│  /api/wallet/transactions               (Teacher)              │
│  /api/wallet/withdraw                   (Teacher)              │
│  /api/wallet/admin/withdrawals/pending  (Admin)                │
│  /api/wallet/admin/withdrawals/:id/*    (Admin)                │
│  /api/wallet/admin/stats                (Admin)                │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                      Middleware Layer                           │
│  - protect (JWT Authentication)                                │
│  - authorize (Role-based Access)                               │
│  - express-validator (Input Validation)                        │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                     Controller Layer                            │
│  wallet.ts                                                     │
│  - getWalletBalance()                                          │
│  - getTransactionHistory()                                     │
│  - requestWithdrawal()                                         │
│  - getPendingWithdrawals()                                     │
│  - approveWithdrawal()                                         │
│  - rejectWithdrawal()                                          │
│  - getWalletStats()                                            │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
│  wallet.service.ts                                             │
│  - getOrCreateWallet()                                         │
│  - creditWallet()                                              │
│  - requestWithdrawal()                                         │
│  - approveWithdrawal()                                         │
│  - rejectWithdrawal()                                          │
│  - getWalletSummary()                                          │
│  - getTransactionHistory()                                     │
│  - getPendingWithdrawals()                                     │
│  - getWalletStats()                                            │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                       Model Layer                               │
│  - Wallet.ts                                                   │
│  - WalletTransaction.ts                                        │
│  - User.ts                                                     │
│  - Payment.ts                                                  │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                      MongoDB Database                           │
│  Collections: users, wallets, wallettransactions, payments    │
└────────────────────────────────────────────────────────────────┘
```

---

## Transaction State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│              WalletTransaction Status Flow                       │
└─────────────────────────────────────────────────────────────────┘

CREDIT Transactions:
┌─────────┐
│ PENDING │  (Never used - credits are instant)
└─────────┘

┌───────────┐
│ COMPLETED │  ◄── Payment Success → Auto-credited
└───────────┘


WITHDRAWAL Transactions:
┌─────────┐
│ PENDING │  ◄── Teacher requests withdrawal
└────┬────┘
     │
     ├─────────────┬─────────────┐
     │             │             │
     ▼             ▼             ▼
┌───────────┐ ┌──────────┐ ┌────────────┐
│ COMPLETED │ │ REJECTED │ │ CANCELLED  │
└───────────┘ └──────────┘ └────────────┘
     ▲             ▲             ▲
     │             │             │
Admin Approves  Admin Rejects  System/User
                               Cancels
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Security Layers                              │
└─────────────────────────────────────────────────────────────────┘

Request
   │
   ▼
┌────────────────────────────────────────┐
│  1. HTTPS/TLS Encryption               │
│     (Production deployment)            │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  2. CORS Policy                        │
│     (Allowed origins only)             │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  3. Rate Limiting                      │
│     (Prevent abuse)                    │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  4. JWT Authentication                 │
│     (protect middleware)               │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  5. Role-Based Authorization           │
│     (authorize middleware)             │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  6. Input Validation                   │
│     (express-validator)                │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  7. Business Logic Validation          │
│     (Service layer checks)             │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  8. Database Constraints               │
│     (Schema validation)                │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  9. Atomic Transactions                │
│     (MongoDB sessions)                 │
└────────────────────────────────────────┘
```

---

## Data Flow Summary

### Payment → Wallet Credit
```
Payment (1000 BDT)
    ↓
Commission Calculation (10% = 100 BDT)
    ↓
Net Amount (900 BDT)
    ↓
Create Transaction (CREDIT, COMPLETED)
    ↓
Update Wallet (balance += 900, totalEarned += 900)
    ↓
Teacher sees updated balance
```

### Withdrawal Request → Approval
```
Teacher Request (500 BDT)
    ↓
Validation (balance check, no pending)
    ↓
Create Transaction (WITHDRAWAL, PENDING)
    ↓
Admin Reviews
    ↓
Admin Approves
    ↓
Update Transaction (COMPLETED)
    ↓
Update Wallet (balance -= 500, totalWithdrawn += 500)
    ↓
Teacher notified
```

---

## Performance Optimizations

### Database Indexes
```
Wallet:
  - teacher (unique, indexed)

WalletTransaction:
  - wallet (indexed)
  - teacher (indexed)
  - type (indexed)
  - status (indexed)
  - Compound: teacher + type + status
  - Compound: wallet + createdAt
  - Compound: status + type
```

### Query Optimization
- Use lean() for read-only queries
- Populate only required fields
- Limit and pagination on large datasets
- Aggregate for statistics

### Transaction Safety
- MongoDB sessions for atomic operations
- Rollback on errors
- Prevent race conditions

---

This architecture ensures:
✅ **Scalability** - Can handle thousands of transactions
✅ **Security** - Multiple layers of protection
✅ **Reliability** - Atomic transactions prevent data corruption
✅ **Performance** - Optimized queries and indexes
✅ **Maintainability** - Clean separation of concerns
