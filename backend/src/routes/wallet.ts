import express from 'express';
import { body } from 'express-validator';
import { protect, authorize } from '../middleware/auth';
import {
  getWalletBalance,
  getTransactionHistory,
  requestWithdrawal,
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getWalletStats,
} from '../controllers/wallet';

const router = express.Router();

// ==================== Teacher Routes ====================

/**
 * @route   GET /api/wallet/balance
 * @desc    Get wallet balance and summary
 * @access  Private (Teacher only)
 */
router.get('/balance', protect, authorize('teacher'), getWalletBalance);

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get transaction history
 * @access  Private (Teacher only)
 * @query   type (optional): CREDIT | WITHDRAWAL
 * @query   status (optional): PENDING | COMPLETED | REJECTED | CANCELLED
 * @query   limit (optional): number of records
 * @query   skip (optional): pagination offset
 */
router.get('/transactions', protect, authorize('teacher'), getTransactionHistory);

/**
 * @route   POST /api/wallet/withdraw
 * @desc    Request a withdrawal
 * @access  Private (Teacher only)
 */
router.post(
  '/withdraw',
  protect,
  authorize('teacher'),
  [
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be a positive number'),
    body('withdrawalMethod')
      .isIn(['BANK_TRANSFER', 'MOBILE_BANKING', 'PAYPAL', 'OTHER'])
      .withMessage('Invalid withdrawal method'),
    body('withdrawalDetails')
      .isObject()
      .withMessage('Withdrawal details must be an object'),
  ],
  requestWithdrawal
);

// ==================== Admin Routes ====================

/**
 * @route   GET /api/wallet/admin/withdrawals/pending
 * @desc    Get all pending withdrawal requests
 * @access  Private (Admin only)
 */
router.get(
  '/admin/withdrawals/pending',
  protect,
  authorize('admin'),
  getPendingWithdrawals
);

/**
 * @route   PUT /api/wallet/admin/withdrawals/:transactionId/approve
 * @desc    Approve a withdrawal request
 * @access  Private (Admin only)
 */
router.put(
  '/admin/withdrawals/:transactionId/approve',
  protect,
  authorize('admin'),
  approveWithdrawal
);

/**
 * @route   PUT /api/wallet/admin/withdrawals/:transactionId/reject
 * @desc    Reject a withdrawal request
 * @access  Private (Admin only)
 */
router.put(
  '/admin/withdrawals/:transactionId/reject',
  protect,
  authorize('admin'),
  [
    body('reason')
      .notEmpty()
      .withMessage('Rejection reason is required')
      .isLength({ min: 10 })
      .withMessage('Reason must be at least 10 characters'),
  ],
  rejectWithdrawal
);

/**
 * @route   GET /api/wallet/admin/stats
 * @desc    Get wallet statistics
 * @access  Private (Admin only)
 */
router.get('/admin/stats', protect, authorize('admin'), getWalletStats);

export default router;
