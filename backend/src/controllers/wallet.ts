import { Request, Response } from 'express';
import walletService from '../services/wallet.service';
import { validationResult } from 'express-validator';
import { logActivity } from '../utils/activityLogger';

/**
 * Get wallet balance and summary for the authenticated teacher
 * @route GET /api/wallet/balance
 * @access Private (Teacher only)
 */
export const getWalletBalance = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?._id;
    
    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const summary = await walletService.getWalletSummary(teacherId);
    
    return res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('getWalletBalance error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch wallet balance',
    });
  }
};

/**
 * Get transaction history for the authenticated teacher
 * @route GET /api/wallet/transactions
 * @access Private (Teacher only)
 */
export const getTransactionHistory = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user?._id;
    
    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { type, status, limit, skip } = req.query;

    const result = await walletService.getTransactionHistory({
      teacherId,
      type: type as any,
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined,
    });
    
    return res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('getTransactionHistory error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch transaction history',
    });
  }
};

/**
 * Request a withdrawal
 * @route POST /api/wallet/withdraw
 * @access Private (Teacher only)
 */
export const requestWithdrawal = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const teacherId = req.user?._id;
    
    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { amount, withdrawalMethod, withdrawalDetails } = req.body;

    const transaction = await walletService.requestWithdrawal({
      teacherId,
      amount: parseFloat(amount),
      withdrawalMethod,
      withdrawalDetails,
    });
    
    try {
      await logActivity({
        userId: teacherId,
        action: 'wallet.withdraw.request',
        targetType: 'WalletTransaction',
        targetId: (transaction as any)?._id,
        metadata: { amount: transaction?.netAmount || parseFloat(amount), method: withdrawalMethod },
        req,
      });
    } catch {}

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully. Admin will review it shortly.',
      data: transaction,
    });
  } catch (error: any) {
    console.error('requestWithdrawal error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to request withdrawal',
    });
  }
};

/**
 * Admin: Get all pending withdrawal requests
 * @route GET /api/wallet/admin/withdrawals/pending
 * @access Private (Admin only)
 */
export const getPendingWithdrawals = async (req: Request, res: Response) => {
  try {
    const { limit, skip } = req.query;

    const result = await walletService.getPendingWithdrawals({
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined,
    });
    
    return res.json({
      success: true,
      data: result.withdrawals,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('getPendingWithdrawals error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pending withdrawals',
    });
  }
};

/**
 * Admin: Approve a withdrawal request
 * @route PUT /api/wallet/admin/withdrawals/:transactionId/approve
 * @access Private (Admin only)
 */
export const approveWithdrawal = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const adminId = req.user?._id;
    
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const transaction = await walletService.approveWithdrawal({
      transactionId,
      adminId,
    });
    
    try {
      await logActivity({
        userId: adminId,
        action: 'wallet.withdraw.approve',
        targetType: 'WalletTransaction',
        targetId: (transaction as any)?._id,
        metadata: { transactionId, amount: (transaction as any)?.amount },
        req,
      });
    } catch {}

    return res.json({
      success: true,
      message: 'Withdrawal approved successfully',
      data: transaction,
    });
  } catch (error: any) {
    console.error('approveWithdrawal error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to approve withdrawal',
    });
  }
};

/**
 * Admin: Reject a withdrawal request
 * @route PUT /api/wallet/admin/withdrawals/:transactionId/reject
 * @access Private (Admin only)
 */
export const rejectWithdrawal = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;
    const adminId = req.user?._id;
    
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const transaction = await walletService.rejectWithdrawal({
      transactionId,
      adminId,
      reason,
    });
    
    try {
      await logActivity({
        userId: adminId,
        action: 'wallet.withdraw.reject',
        targetType: 'WalletTransaction',
        targetId: (transaction as any)?._id,
        metadata: { transactionId, reason },
        req,
      });
    } catch {}

    return res.json({
      success: true,
      message: 'Withdrawal rejected',
      data: transaction,
    });
  } catch (error: any) {
    console.error('rejectWithdrawal error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to reject withdrawal',
    });
  }
};

/**
 * Admin: Get wallet statistics
 * @route GET /api/wallet/admin/stats
 * @access Private (Admin only)
 */
export const getWalletStats = async (req: Request, res: Response) => {
  try {
    const stats = await walletService.getWalletStats();
    
    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('getWalletStats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch wallet statistics',
    });
  }
};
