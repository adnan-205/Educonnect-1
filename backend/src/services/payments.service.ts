import axios from 'axios';
import { Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import sslcz from '../config/sslcommerz';
import Gig from '../models/Gig';
import paymentRepo from '../repositories/PaymentRepository';
import bookingRepo from '../repositories/BookingRepository';
import { logPaymentEvent } from '../utils/paymentLogger';

export class PaymentsService {
  /**
   * Initialize payment in SSLCommerz and persist a Payment document in PENDING state.
   */
  async initPayment(params: { gigId: string; bookingId?: string; studentId: string; studentName?: string; studentEmail?: string }) {
    const { gigId, bookingId, studentId, studentName, studentEmail } = params;

    const gig = await Gig.findById(gigId).select('teacher title price');
    if (!gig) throw new Error('Gig not found');

    const amount = (gig as any).price;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid gig price for payment');
    }

    const teacherId = (gig as any).teacher as Types.ObjectId;
    const tran_id = typeof randomUUID === 'function' ? randomUUID() : uuidv4();

    const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

    // Create Payment doc first
    await paymentRepo.create({
      gigId: new Types.ObjectId(gigId),
      bookingId: bookingId ? new Types.ObjectId(bookingId) : undefined,
      studentId: new Types.ObjectId(studentId),
      teacherId: new Types.ObjectId(teacherId),
      amount,
      status: 'PENDING',
      transactionId: tran_id,
    } as any);

    const data: any = {
      total_amount: amount,
      currency: 'BDT',
      tran_id,
      success_url: `${BASE_URL}/api/payments/success/${tran_id}`,
      fail_url: `${BASE_URL}/api/payments/fail/${tran_id}`,
      cancel_url: `${BASE_URL}/api/payments/cancel/${tran_id}`,
      ipn_url: `${BASE_URL}/api/payments/ipn`,
      product_name: 'EduConnect Class',
      product_category: 'Education',
      product_profile: 'service',
      shipping_method: 'NO',
      emi_option: 0,
      cus_name: studentName || 'Student',
      cus_email: studentEmail || 'student@example.com',
      cus_add1: 'Dhaka',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      cus_phone: '01711111111',
    };

    logPaymentEvent('init-payload', { tran_id, gigId, bookingId, studentId, amount });

    const apiResponse = await (sslcz as any).init(data);
    const GatewayPageURL = apiResponse?.GatewayPageURL;
    if (!GatewayPageURL) {
      logPaymentEvent('init-no-gateway-url', { tran_id, apiResponse });
      const err = new Error('Failed to initialize payment gateway');
      (err as any).response = apiResponse;
      throw err;
    }

    return { url: GatewayPageURL, tran_id };
  }

  /**
   * Mark payment SUCCESS and optionally update linked booking.
   */
  async handleSuccess(tran_id: string) {
    const updated = await paymentRepo.markSuccess(tran_id);
    if (updated?.bookingId) {
      try {
        await bookingRepo.updateStatus(updated.bookingId.toString(), 'accepted');
      } catch {}
    }
    logPaymentEvent('success', { tran_id, updatedId: updated?._id, bookingId: updated?.bookingId });
    return updated;
  }

  async handleFailure(tran_id: string) {
    const updated = await paymentRepo.markFailure(tran_id);
    logPaymentEvent('fail', { tran_id, updatedId: updated?._id });
    return updated;
  }

  async handleCancel(tran_id: string) {
    const updated = await paymentRepo.markFailure(tran_id);
    logPaymentEvent('cancel', { tran_id, updatedId: updated?._id });
    return updated;
  }

  /**
   * Handle IPN server-to-server callback and validate transaction.
   */
  async handleIPN(body: any) {
    const { tran_id, status, val_id } = body || {};
    if (!tran_id) throw new Error('Missing tran_id');

    let updateStatus: 'SUCCESS' | 'FAILED' = 'FAILED';

    try {
      if (val_id) {
        const isLive = (process.env.SSL_IS_LIVE || 'false') === 'true';
        const base = isLive ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com';
        const store_id = process.env.SSL_STORE_ID;
        const store_passwd = process.env.SSL_STORE_PASS;
        const url = `${base}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(val_id)}&store_id=${encodeURIComponent(store_id || '')}&store_passwd=${encodeURIComponent(store_passwd || '')}&format=json`;
        const resp = await axios.get(url, { timeout: 8000 });
        const data = resp?.data || {};
        if ((data.status === 'VALID' || data.status === 'VALIDATED') && data.tran_id === tran_id) {
          updateStatus = 'SUCCESS';
        }
      } else if (status === 'VALID' || status === 'VALIDATED') {
        updateStatus = 'SUCCESS';
      }
    } catch (e) {
      logPaymentEvent('validator-error', { tran_id, message: (e as any)?.message });
    }

    if (updateStatus === 'SUCCESS') await paymentRepo.markSuccess(tran_id);
    else await paymentRepo.markFailure(tran_id);

    logPaymentEvent('ipn', { tran_id, status: updateStatus });
    return updateStatus;
  }
}

export default new PaymentsService();
