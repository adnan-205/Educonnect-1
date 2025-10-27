# 🚀 Wallet System - Quick Start Guide

## 5-Minute Setup

### Step 1: Verify Configuration ✅
Your `.env` already has:
```env
PLATFORM_COMMISSION_RATE=0.10
```
This means 10% commission on all payments.

### Step 2: Start Your Server 🔥
```bash
cd backend
npm run dev
```

### Step 3: Initialize Wallets for Existing Teachers 💼
```bash
npx ts-node src/scripts/initializeWallets.ts
```

**Done!** Your wallet system is now active. 🎉

---

## Test It Right Now

### Quick Test (Using curl)

**1. Get Teacher Wallet Balance:**
```bash
curl -X GET http://localhost:5000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN"
```

**2. Request Withdrawal:**
```bash
curl -X POST http://localhost:5000/api/wallet/withdraw \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "withdrawalMethod": "BANK_TRANSFER",
    "withdrawalDetails": {
      "accountNumber": "1234567890",
      "accountName": "John Doe",
      "bankName": "Test Bank"
    }
  }'
```

**3. Admin Views Pending Withdrawals:**
```bash
curl -X GET http://localhost:5000/api/wallet/admin/withdrawals/pending \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## How It Works (Simple Explanation)

### 💰 When Student Pays:
```
Student pays 1000 BDT
    ↓
Platform takes 10% commission (100 BDT)
    ↓
Teacher gets 900 BDT in wallet
    ↓
Automatic! No manual work needed.
```

### 💸 When Teacher Withdraws:
```
Teacher requests withdrawal
    ↓
Admin reviews request
    ↓
Admin approves
    ↓
Money deducted from wallet
    ↓
Teacher receives payment offline
```

---

## API Endpoints (Copy-Paste Ready)

### For Teachers:
```javascript
// Get balance
GET /api/wallet/balance

// Get transactions
GET /api/wallet/transactions

// Request withdrawal
POST /api/wallet/withdraw
{
  "amount": 1000,
  "withdrawalMethod": "BANK_TRANSFER",
  "withdrawalDetails": { ... }
}
```

### For Admins:
```javascript
// View pending withdrawals
GET /api/wallet/admin/withdrawals/pending

// Approve withdrawal
PUT /api/wallet/admin/withdrawals/:id/approve

// Reject withdrawal
PUT /api/wallet/admin/withdrawals/:id/reject
{
  "reason": "Reason for rejection"
}
```

---

## Frontend Integration (React/Next.js)

### Simple Balance Display:
```typescript
const [balance, setBalance] = useState(0);

useEffect(() => {
  fetch('/api/wallet/balance', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => setBalance(data.data.balance));
}, []);

return <div>Balance: BDT {balance}</div>;
```

### Simple Withdrawal Form:
```typescript
const handleWithdraw = async (amount) => {
  const response = await fetch('/api/wallet/withdraw', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount,
      withdrawalMethod: 'BANK_TRANSFER',
      withdrawalDetails: { /* account details */ }
    })
  });
  
  if (response.ok) {
    alert('Withdrawal requested!');
  }
};
```

---

## Common Questions

### Q: Do I need to create wallets manually?
**A:** No! Wallets are automatically created when needed.

### Q: How do I change the commission rate?
**A:** Edit `PLATFORM_COMMISSION_RATE` in `.env` (0.10 = 10%, 0.15 = 15%)

### Q: Can teachers withdraw immediately?
**A:** No, admin must approve all withdrawals for security.

### Q: What happens if payment fails?
**A:** Wallet is not credited. Only successful payments credit the wallet.

### Q: Can I test without real payments?
**A:** Yes! Use the test file: `test-wallet.http`

---

## Files You Need to Know

### Essential Files:
```
backend/src/
├── models/
│   ├── Wallet.ts              ← Wallet database model
│   └── WalletTransaction.ts   ← Transaction records
├── services/
│   └── wallet.service.ts      ← Business logic
├── controllers/
│   └── wallet.ts              ← API handlers
└── routes/
    └── wallet.ts              ← API routes
```

### Documentation:
```
backend/
├── WALLET_README.md                    ← Quick reference
├── WALLET_SYSTEM_DOCUMENTATION.md      ← Full docs
├── WALLET_EXAMPLES.md                  ← Code examples
├── WALLET_IMPLEMENTATION_SUMMARY.md    ← What's implemented
└── test-wallet.http                    ← API tests
```

---

## Troubleshooting (30 Seconds)

**Problem:** Server won't start  
**Fix:** Check MongoDB connection in `.env`

**Problem:** Wallet shows 0 balance  
**Fix:** Make a test payment first

**Problem:** Can't withdraw  
**Fix:** Check if you have pending withdrawal already

**Problem:** Admin can't approve  
**Fix:** Verify user has 'admin' role

---

## Next Steps

1. ✅ **Test the API** - Use `test-wallet.http`
2. ✅ **Build Frontend** - Use examples in `WALLET_EXAMPLES.md`
3. ✅ **Customize** - Adjust commission rate if needed
4. ✅ **Deploy** - Push to production when ready

---

## Need Help?

1. **Full Documentation:** `WALLET_SYSTEM_DOCUMENTATION.md`
2. **Code Examples:** `WALLET_EXAMPLES.md`
3. **API Tests:** `test-wallet.http`
4. **Implementation Details:** `WALLET_IMPLEMENTATION_SUMMARY.md`

---

## That's It! 🎉

Your wallet system is **ready to use** right now!

- ✅ Automatic payment crediting
- ✅ Commission handling
- ✅ Withdrawal management
- ✅ Admin approval system
- ✅ Transaction history
- ✅ Secure & validated

**Start testing and enjoy your new wallet system!** 💰

---

*Quick Start Guide v1.0*
