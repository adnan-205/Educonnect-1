import mongoose from 'mongoose';
import Wallet from '../models/Wallet';
import WalletTransaction from '../models/WalletTransaction';
import User from '../models/User';

export class WalletService {
  // Platform commission rate (e.g., 10% = 0.10)
  private readonly COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.10');

  /**
   * Get or create wallet for a teacher
   */
  async getOrCreateWallet(teacherId: string | mongoose.Types.ObjectId) {
    let wallet = await Wallet.findOne({ teacher: teacherId });
    
    if (!wallet) {
      wallet = await Wallet.create({
        teacher: teacherId,
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        currency: 'BDT',
      });

      // Update user document with wallet reference
      await User.findByIdAndUpdate(teacherId, { wallet: wallet._id });
    }

    return wallet;
  }

  /**
   * Credit wallet after successful payment
   * Automatically deducts platform commission
   */
  async creditWallet(params: {
    teacherId: string | mongoose.Types.ObjectId;
    amount: number;
    paymentId?: string | mongoose.Types.ObjectId;
    bookingId?: string | mongoose.Types.ObjectId;
    description?: string;
  }) {
    const { teacherId, amount, paymentId, bookingId, description } = params;

    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    const wallet = await this.getOrCreateWallet(teacherId);
    
    // Calculate commission and net amount
    const commission = Math.round(amount * this.COMMISSION_RATE * 100) / 100;
    const netAmount = Math.round((amount - commission) * 100) / 100;

    // Start a session for transaction atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create transaction record
      const transaction = await WalletTransaction.create([{
        wallet: wallet._id,
        teacher: teacherId,
        type: 'CREDIT',
        amount,
        commission,
        netAmount,
        status: 'COMPLETED',
        description: description || `Payment received for class`,
        payment: paymentId,
        booking: bookingId,
      }], { session });

      // Update wallet balance
      wallet.balance += netAmount;
      wallet.totalEarned += netAmount;
      await wallet.save({ session });

      await session.commitTransaction();
      
      return {
        wallet,
        transaction: transaction[0],
        credited: netAmount,
        commission,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Request withdrawal (creates PENDING transaction)
   */
  async requestWithdrawal(params: {
    teacherId: string | mongoose.Types.ObjectId;
    amount: number;
    withdrawalMethod: string;
    withdrawalDetails: any;
  }) {
    const { teacherId, amount, withdrawalMethod, withdrawalDetails } = params;

    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }

    const wallet = await this.getOrCreateWallet(teacherId);

    if (wallet.balance < amount) {
      throw new Error(`Insufficient balance. Available: ${wallet.balance}, Requested: ${amount}`);
    }

    // Check for pending withdrawals
    const pendingWithdrawal = await WalletTransaction.findOne({
      teacher: teacherId,
      type: 'WITHDRAWAL',
      status: 'PENDING',
    });

    if (pendingWithdrawal) {
      throw new Error('You already have a pending withdrawal request');
    }

    // Create withdrawal request
    const transaction = await WalletTransaction.create({
      wallet: wallet._id,
      teacher: teacherId,
      type: 'WITHDRAWAL',
      amount,
      commission: 0,
      netAmount: amount,
      status: 'PENDING',
      description: `Withdrawal request via ${withdrawalMethod}`,
      withdrawalMethod,
      withdrawalDetails,
    });

    return transaction;
  }

  /**
   * Admin approves withdrawal
   */
  async approveWithdrawal(params: {
    transactionId: string | mongoose.Types.ObjectId;
    adminId: string | mongoose.Types.ObjectId;
  }) {
    const { transactionId, adminId } = params;

    const transaction = await WalletTransaction.findById(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.type !== 'WITHDRAWAL') {
      throw new Error('Transaction is not a withdrawal');
    }

    if (transaction.status !== 'PENDING') {
      throw new Error(`Cannot approve transaction with status: ${transaction.status}`);
    }

    const wallet = await Wallet.findById(transaction.wallet);
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.balance < transaction.amount) {
      throw new Error('Insufficient wallet balance');
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update transaction status
      transaction.status = 'COMPLETED';
      transaction.processedBy = adminId as any;
      transaction.processedAt = new Date();
      await transaction.save({ session });

      // Deduct from wallet
      wallet.balance -= transaction.amount;
      wallet.totalWithdrawn += transaction.amount;
      await wallet.save({ session });

      await session.commitTransaction();
      
      return transaction;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Admin rejects withdrawal
   */
  async rejectWithdrawal(params: {
    transactionId: string | mongoose.Types.ObjectId;
    adminId: string | mongoose.Types.ObjectId;
    reason: string;
  }) {
    const { transactionId, adminId, reason } = params;

    const transaction = await WalletTransaction.findById(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.type !== 'WITHDRAWAL') {
      throw new Error('Transaction is not a withdrawal');
    }

    if (transaction.status !== 'PENDING') {
      throw new Error(`Cannot reject transaction with status: ${transaction.status}`);
    }

    transaction.status = 'REJECTED';
    transaction.processedBy = adminId as any;
    transaction.processedAt = new Date();
    transaction.rejectionReason = reason;
    
    await transaction.save();
    
    return transaction;
  }

  /**
   * Get wallet balance and summary
   */
  async getWalletSummary(teacherId: string | mongoose.Types.ObjectId) {
    const wallet = await this.getOrCreateWallet(teacherId);
    
    const pendingWithdrawals = await WalletTransaction.aggregate([
      {
        $match: {
          teacher: new mongoose.Types.ObjectId(teacherId as string),
          type: 'WITHDRAWAL',
          status: 'PENDING',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const pendingAmount = pendingWithdrawals[0]?.total || 0;

    return {
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalWithdrawn: wallet.totalWithdrawn,
      pendingWithdrawals: pendingAmount,
      availableForWithdrawal: wallet.balance - pendingAmount,
      currency: wallet.currency,
    };
  }

  /**
   * Get transaction history with filters
   */
  async getTransactionHistory(params: {
    teacherId: string | mongoose.Types.ObjectId;
    type?: 'CREDIT' | 'WITHDRAWAL';
    status?: string;
    limit?: number;
    skip?: number;
  }) {
    const { teacherId, type, status, limit = 50, skip = 0 } = params;

    const query: any = { teacher: teacherId };
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('payment', 'transactionId amount')
      .populate('booking', 'scheduledDate scheduledTime')
      .populate('processedBy', 'name email')
      .lean();

    const total = await WalletTransaction.countDocuments(query);

    return {
      transactions,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + transactions.length < total,
      },
    };
  }

  /**
   * Admin: Get all pending withdrawal requests
   */
  async getPendingWithdrawals(params: { limit?: number; skip?: number }) {
    const { limit = 50, skip = 0 } = params;

    const withdrawals = await WalletTransaction.find({
      type: 'WITHDRAWAL',
      status: 'PENDING',
    })
      .sort({ createdAt: 1 }) // Oldest first
      .limit(limit)
      .skip(skip)
      .populate('teacher', 'name email phone')
      .populate('wallet', 'balance')
      .lean();

    const total = await WalletTransaction.countDocuments({
      type: 'WITHDRAWAL',
      status: 'PENDING',
    });

    return {
      withdrawals,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + withdrawals.length < total,
      },
    };
  }

  /**
   * Admin: Get wallet statistics
   */
  async getWalletStats() {
    const stats = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' },
          totalEarned: { $sum: '$totalEarned' },
          totalWithdrawn: { $sum: '$totalWithdrawn' },
          teacherCount: { $sum: 1 },
        },
      },
    ]);

    const pendingWithdrawals = await WalletTransaction.aggregate([
      {
        $match: {
          type: 'WITHDRAWAL',
          status: 'PENDING',
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
    ]);

    return {
      totalBalance: stats[0]?.totalBalance || 0,
      totalEarned: stats[0]?.totalEarned || 0,
      totalWithdrawn: stats[0]?.totalWithdrawn || 0,
      teacherCount: stats[0]?.teacherCount || 0,
      pendingWithdrawals: {
        count: pendingWithdrawals[0]?.count || 0,
        amount: pendingWithdrawals[0]?.amount || 0,
      },
    };
  }
}

export default new WalletService();
