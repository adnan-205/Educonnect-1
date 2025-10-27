# Wallet System Usage Examples

## Quick Start Guide

### 1. Teacher Checks Wallet Balance

```javascript
// Frontend API call
const response = await fetch('http://localhost:5000/api/wallet/balance', {
  headers: {
    'Authorization': `Bearer ${teacherToken}`,
  },
});

const data = await response.json();
console.log(data);
// Output:
// {
//   "success": true,
//   "data": {
//     "balance": 4500,
//     "totalEarned": 5000,
//     "totalWithdrawn": 500,
//     "pendingWithdrawals": 0,
//     "availableForWithdrawal": 4500,
//     "currency": "BDT"
//   }
// }
```

---

### 2. Teacher Views Transaction History

```javascript
// Get all transactions
const response = await fetch('http://localhost:5000/api/wallet/transactions', {
  headers: {
    'Authorization': `Bearer ${teacherToken}`,
  },
});

// Get only credits
const response = await fetch('http://localhost:5000/api/wallet/transactions?type=CREDIT', {
  headers: {
    'Authorization': `Bearer ${teacherToken}`,
  },
});

// Get only completed withdrawals
const response = await fetch('http://localhost:5000/api/wallet/transactions?type=WITHDRAWAL&status=COMPLETED', {
  headers: {
    'Authorization': `Bearer ${teacherToken}`,
  },
});

// Pagination
const response = await fetch('http://localhost:5000/api/wallet/transactions?limit=10&skip=0', {
  headers: {
    'Authorization': `Bearer ${teacherToken}`,
  },
});
```

---

### 3. Teacher Requests Bank Transfer Withdrawal

```javascript
const response = await fetch('http://localhost:5000/api/wallet/withdraw', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${teacherToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 2000,
    withdrawalMethod: 'BANK_TRANSFER',
    withdrawalDetails: {
      accountNumber: '1234567890123456',
      accountName: 'John Doe',
      bankName: 'Dutch Bangla Bank',
      branchName: 'Gulshan Branch',
      routingNumber: '090271234',
    },
  }),
});

const data = await response.json();
console.log(data);
// Output:
// {
//   "success": true,
//   "message": "Withdrawal request submitted successfully. Admin will review it shortly.",
//   "data": { ... }
// }
```

---

### 4. Teacher Requests Mobile Banking Withdrawal (bKash/Nagad)

```javascript
const response = await fetch('http://localhost:5000/api/wallet/withdraw', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${teacherToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 1500,
    withdrawalMethod: 'MOBILE_BANKING',
    withdrawalDetails: {
      mobileNumber: '+8801711111111',
      accountName: 'John Doe',
      provider: 'bKash', // or 'Nagad', 'Rocket'
    },
  }),
});
```

---

### 5. Teacher Requests PayPal Withdrawal

```javascript
const response = await fetch('http://localhost:5000/api/wallet/withdraw', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${teacherToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 3000,
    withdrawalMethod: 'PAYPAL',
    withdrawalDetails: {
      email: 'john.doe@example.com',
      accountName: 'John Doe',
    },
  }),
});
```

---

### 6. Admin Views Pending Withdrawals

```javascript
const response = await fetch('http://localhost:5000/api/wallet/admin/withdrawals/pending', {
  headers: {
    'Authorization': `Bearer ${adminToken}`,
  },
});

const data = await response.json();
console.log(data);
// Output:
// {
//   "success": true,
//   "data": [
//     {
//       "_id": "...",
//       "teacher": {
//         "name": "John Doe",
//         "email": "john@example.com",
//         "phone": "+8801711111111"
//       },
//       "amount": 2000,
//       "withdrawalMethod": "BANK_TRANSFER",
//       "withdrawalDetails": { ... },
//       "status": "PENDING",
//       "createdAt": "2025-01-15T11:00:00Z"
//     }
//   ]
// }
```

---

### 7. Admin Approves Withdrawal

```javascript
const transactionId = '65abc123def456789';

const response = await fetch(
  `http://localhost:5000/api/wallet/admin/withdrawals/${transactionId}/approve`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  }
);

const data = await response.json();
console.log(data);
// Output:
// {
//   "success": true,
//   "message": "Withdrawal approved successfully",
//   "data": {
//     "status": "COMPLETED",
//     "processedBy": "...",
//     "processedAt": "2025-01-15T12:00:00Z"
//   }
// }
```

---

### 8. Admin Rejects Withdrawal

```javascript
const transactionId = '65abc123def456789';

const response = await fetch(
  `http://localhost:5000/api/wallet/admin/withdrawals/${transactionId}/reject`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: 'Bank account details do not match the registered name. Please provide correct information.',
    }),
  }
);

const data = await response.json();
console.log(data);
// Output:
// {
//   "success": true,
//   "message": "Withdrawal rejected",
//   "data": {
//     "status": "REJECTED",
//     "rejectionReason": "Bank account details do not match...",
//     "processedBy": "...",
//     "processedAt": "2025-01-15T12:00:00Z"
//   }
// }
```

---

### 9. Admin Views Wallet Statistics

```javascript
const response = await fetch('http://localhost:5000/api/wallet/admin/stats', {
  headers: {
    'Authorization': `Bearer ${adminToken}`,
  },
});

const data = await response.json();
console.log(data);
// Output:
// {
//   "success": true,
//   "data": {
//     "totalBalance": 125000,      // Total balance across all wallets
//     "totalEarned": 500000,       // Total earned by all teachers
//     "totalWithdrawn": 375000,    // Total withdrawn by all teachers
//     "teacherCount": 50,          // Number of teachers with wallets
//     "pendingWithdrawals": {
//       "count": 5,                // Number of pending requests
//       "amount": 15000            // Total pending amount
//     }
//   }
// }
```

---

## React/Next.js Component Examples

### Teacher Wallet Dashboard Component

```typescript
'use client';

import { useEffect, useState } from 'react';

interface WalletSummary {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  availableForWithdrawal: number;
  currency: string;
}

export default function TeacherWallet() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setWallet(data.data);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Wallet</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Available Balance</h3>
          <p className="text-3xl font-bold text-green-600">
            {wallet?.currency} {wallet?.balance.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Total Earned</h3>
          <p className="text-3xl font-bold">
            {wallet?.currency} {wallet?.totalEarned.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Total Withdrawn</h3>
          <p className="text-3xl font-bold">
            {wallet?.currency} {wallet?.totalWithdrawn.toLocaleString()}
          </p>
        </div>
      </div>

      {wallet && wallet.pendingWithdrawals > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          <p className="text-yellow-800">
            You have a pending withdrawal of {wallet.currency} {wallet.pendingWithdrawals}
          </p>
        </div>
      )}

      <button
        onClick={() => {/* Open withdrawal modal */}}
        disabled={!wallet || wallet.availableForWithdrawal <= 0}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        Request Withdrawal
      </button>
    </div>
  );
}
```

---

### Withdrawal Request Form Component

```typescript
'use client';

import { useState } from 'react';

export default function WithdrawalForm() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [details, setDetails] = useState({
    accountNumber: '',
    accountName: '',
    bankName: '',
    branchName: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          withdrawalMethod: method,
          withdrawalDetails: details,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Withdrawal request submitted successfully!');
        // Reset form or redirect
      } else {
        alert(data.message || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Request Withdrawal</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
          min="1"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Method</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="MOBILE_BANKING">Mobile Banking</option>
          <option value="PAYPAL">PayPal</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {method === 'BANK_TRANSFER' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Account Number</label>
            <input
              type="text"
              value={details.accountNumber}
              onChange={(e) => setDetails({...details, accountNumber: e.target.value})}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Account Name</label>
            <input
              type="text"
              value={details.accountName}
              onChange={(e) => setDetails({...details, accountName: e.target.value})}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Bank Name</label>
            <input
              type="text"
              value={details.bankName}
              onChange={(e) => setDetails({...details, bankName: e.target.value})}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Branch Name</label>
            <input
              type="text"
              value={details.branchName}
              onChange={(e) => setDetails({...details, branchName: e.target.value})}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
}
```

---

## Testing Workflow

### Complete End-to-End Test

```bash
# 1. Student makes a payment (1000 BDT)
# Payment succeeds → Teacher wallet credited with 900 BDT (10% commission)

# 2. Teacher checks balance
curl -X GET http://localhost:5000/api/wallet/balance \
  -H "Authorization: Bearer <teacher_token>"

# Expected: balance = 900, totalEarned = 900

# 3. Teacher requests withdrawal (500 BDT)
curl -X POST http://localhost:5000/api/wallet/withdraw \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "withdrawalMethod": "BANK_TRANSFER",
    "withdrawalDetails": {
      "accountNumber": "1234567890",
      "accountName": "Teacher Name",
      "bankName": "Test Bank"
    }
  }'

# 4. Admin views pending withdrawals
curl -X GET http://localhost:5000/api/wallet/admin/withdrawals/pending \
  -H "Authorization: Bearer <admin_token>"

# 5. Admin approves withdrawal
curl -X PUT http://localhost:5000/api/wallet/admin/withdrawals/<transactionId>/approve \
  -H "Authorization: Bearer <admin_token>"

# 6. Teacher checks balance again
curl -X GET http://localhost:5000/api/wallet/balance \
  -H "Authorization: Bearer <teacher_token>"

# Expected: balance = 400, totalWithdrawn = 500
```

---

## Common Scenarios

### Scenario 1: Multiple Payments
```
Payment 1: 1000 BDT → Wallet: +900 BDT (commission: 100)
Payment 2: 2000 BDT → Wallet: +1800 BDT (commission: 200)
Payment 3: 500 BDT → Wallet: +450 BDT (commission: 50)

Total Balance: 3150 BDT
Total Earned: 3150 BDT
Total Commission: 350 BDT
```

### Scenario 2: Withdrawal Rejected
```
1. Teacher requests 1000 BDT withdrawal
2. Status: PENDING (balance still 3150)
3. Admin rejects with reason
4. Status: REJECTED (balance still 3150)
5. Teacher can request again
```

### Scenario 3: Insufficient Balance
```
Current Balance: 500 BDT
Withdrawal Request: 1000 BDT
Result: Error - "Insufficient balance. Available: 500, Requested: 1000"
```

---

## Tips & Best Practices

1. **Always check balance before withdrawal request**
2. **Only one pending withdrawal allowed at a time**
3. **Commission is automatically deducted on payment**
4. **Admin should verify account details before approval**
5. **Keep transaction history for accounting**
6. **Use proper error handling in frontend**
7. **Show loading states during API calls**
8. **Display pending withdrawal status to teachers**
9. **Send email notifications for wallet events**
10. **Implement withdrawal limits if needed**
