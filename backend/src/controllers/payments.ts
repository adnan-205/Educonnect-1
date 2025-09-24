import { Request, Response } from 'express';
import Payment from '../models/Payment';
import Gig from '../models/Gig';
import sslcz from '../config/sslcommerz';
import { v4 as uuidv4 } from 'uuid';
import Booking from '../models/Booking';
import axios from 'axios';

// Initialize a payment and return the gateway URL
export const initPayment = async (req: Request, res: Response) => {
  try {
    const { gigId } = req.body as { gigId: string };

    if (!gigId) {
      return res.status(400).json({ success: false, message: 'gigId is required' });
    }

    // Identify parties
    const studentId = req.user?._id;
    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const gig = await Gig.findById(gigId).select('teacher title price');
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    const teacherId = (gig as any).teacher;
    const amount = (gig as any).price;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid gig price for payment' });
    }

    const tran_id = uuidv4();

    await Payment.create({
      gigId,
      studentId,
      teacherId,
      amount,
      status: 'PENDING',
      transactionId: tran_id,
    });

    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

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
      cus_name: (req.user as any)?.name || 'Student',
      cus_email: (req.user as any)?.email || 'student@example.com',
      cus_add1: 'Dhaka',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      cus_phone: '01711111111',
    };

    // Debug log (sanitized)
    try {
      console.log('SSLCommerz init payload (sanitized):', {
        amount,
        currency: data.currency,
        tran_id,
        success_url: data.success_url,
        fail_url: data.fail_url,
        cancel_url: data.cancel_url,
        ipn_url: data.ipn_url,
        product_name: data.product_name,
        cus_name: data.cus_name,
        cus_email: data.cus_email,
      });
    } catch {}

    const apiResponse = await (sslcz as any).init(data);
    const GatewayPageURL = apiResponse?.GatewayPageURL;

    if (!GatewayPageURL) {
      try {
        console.error('SSLCommerz init returned no GatewayPageURL. Response:', apiResponse);
      } catch {}
      const body: any = { success: false, message: 'Failed to initialize payment gateway' };
      if (process.env.NODE_ENV !== 'production') {
        body.reason = apiResponse;
      }
      return res.status(500).json(body);
    }

    return res.json({ success: true, url: GatewayPageURL, tran_id });
  } catch (error: any) {
    const errMsg = error?.response?.data?.failedreason || error?.message || 'Payment initialization failed';
    console.error('initPayment error:', errMsg, { stack: error?.stack, data: error?.response?.data });
    const body: any = { success: false, message: 'Payment initialization failed' };
    if (process.env.NODE_ENV !== 'production') {
      body.reason = errMsg;
    }
    return res.status(500).json(body);
  }
};

// Success callback handler (redirect from SSLCommerz)
export const successPayment = async (req: Request, res: Response) => {
  try {
    const { tran_id } = req.params as { tran_id: string };
    await Payment.findOneAndUpdate({ transactionId: tran_id }, { status: 'SUCCESS' });

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${FRONTEND_URL}/payment-success?tran_id=${encodeURIComponent(tran_id)}`);
  } catch (error) {
    console.error('successPayment error:', error);
    return res.status(500).json({ success: false, message: 'Error processing success callback' });
  }
};

// Failure callback handler (redirect from SSLCommerz)
export const failPayment = async (req: Request, res: Response) => {
  try {
    const { tran_id } = req.params as { tran_id: string };
    await Payment.findOneAndUpdate({ transactionId: tran_id }, { status: 'FAILED' });

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${FRONTEND_URL}/payment-failed`);
  } catch (error) {
    console.error('failPayment error:', error);
    return res.status(500).json({ success: false, message: 'Error processing failure callback' });
  }
};

// Cancel callback handler (optional)
export const cancelPayment = async (req: Request, res: Response) => {
  try {
    const { tran_id } = req.params as { tran_id: string };
    await Payment.findOneAndUpdate({ transactionId: tran_id }, { status: 'FAILED' });

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${FRONTEND_URL}/payment-failed`);
  } catch (error) {
    console.error('cancelPayment error:', error);
    return res.status(500).json({ success: false, message: 'Error processing cancel callback' });
  }
};

// IPN listener (server-to-server confirmation)
export const ipnListener = async (req: Request, res: Response) => {
  try {
    const { tran_id, status, val_id } = req.body || {};
    if (!tran_id) {
      return res.status(400).json({ success: false, message: 'Missing tran_id' });
    }

    // Default to FAILED; only mark SUCCESS after validation
    let updateStatus: 'SUCCESS' | 'FAILED' = 'FAILED';

    // Try server-side validation via SSLCommerz validator API when val_id is present
    // See: https://developer.sslcommerz.com/
    try {
      if (val_id) {
        const isLive = (process.env.SSL_IS_LIVE || 'false') === 'true';
        const base = isLive ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com';
        const store_id = process.env.SSL_STORE_ID;
        const store_passwd = process.env.SSL_STORE_PASS;
        const url = `${base}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(val_id)}&store_id=${encodeURIComponent(store_id || '')}&store_passwd=${encodeURIComponent(store_passwd || '')}&format=json`;
        const resp = await axios.get(url, { timeout: 8000 });
        const data = resp?.data || {};
        // VALID or VALIDATED indicates payment is confirmed
        if ((data.status === 'VALID' || data.status === 'VALIDATED') && data.tran_id === tran_id) {
          updateStatus = 'SUCCESS';
        }
      } else if (status === 'VALID' || status === 'VALIDATED') {
        // Fallback if val_id missing but status indicates valid
        updateStatus = 'SUCCESS';
      }
    } catch (e) {
      // Keep FAILED if validation request fails
      console.error('Validator API error:', (e as any)?.message || e);
    }

    const updated = await Payment.findOneAndUpdate(
      { transactionId: tran_id },
      { status: updateStatus },
      { new: true }
    );

    return res.status(200).json({ success: true, message: 'IPN received', status: updated?.status || updateStatus });
  } catch (error) {
    console.error('IPN error:', error);
    return res.status(500).json({ success: false, message: 'IPN handling failed' });
  }
};

// Teacher or student can check payment status for a specific booking
export const getPaymentStatusForBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params as { bookingId: string };
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const booking = await Booking.findById(bookingId).select('gig student');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Allow if requester is the student of this booking or the teacher of the gig
    const gig = await Gig.findById(booking.gig).select('teacher');
    const isStudent = booking.student?.toString() === userId.toString();
    const isTeacher = gig?.teacher?.toString() === userId.toString();
    if (!isStudent && !isTeacher) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const payment = await Payment.findOne({ gigId: booking.gig, studentId: booking.student, status: 'SUCCESS' }).select('_id');
    return res.json({ success: true, paid: !!payment });
  } catch (error) {
    console.error('getPaymentStatusForBooking error:', error);
    return res.status(500).json({ success: false, message: 'Failed to check payment status' });
  }
};

// Check if current student has paid for a gig
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { gigId } = req.params as { gigId: string };
    const studentId = req.user?._id;

    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!gigId) {
      return res.status(400).json({ success: false, message: 'gigId is required' });
    }

    const payment = await Payment.findOne({ gigId, studentId, status: 'SUCCESS' }).select('_id');
    const isPaid = !!payment;

    return res.json({ success: true, paid: isPaid });
  } catch (error) {
    console.error('getPaymentStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to check payment status' });
  }
};
