import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { paymentsApi } from '@/services/api';

export type PaymentStatus = 'unknown' | 'paid' | 'unpaid' | 'checking' | 'error';

interface UsePaymentOptions {
  gigId: string;
  bookingId?: string;
  pollMs?: number; // default 10s
  autoStart?: boolean; // start polling automatically (default true)
  initialCheck?: boolean; // perform an immediate status check on mount (default true)
}

/**
 * usePayment provides a simple API to initialize payment and track status for a gig or a booking.
 * It polls backend status endpoints and exposes an imperative payNow() that redirects to gateway.
 */
export function usePayment({ gigId, bookingId, pollMs = 10000, autoStart = true, initialCheck = true }: UsePaymentOptions) {
  const [status, setStatus] = useState<PaymentStatus>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Track mount status so async callbacks never update state after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const checkStatus = useCallback(async () => {
    if (!gigId) return;
    try {
      setStatus((prev) => (prev === 'unknown' ? 'checking' : prev));
      const res = bookingId
        ? await paymentsApi.getBookingStatus(bookingId)
        : await paymentsApi.getStatus(gigId);
      const paid = !!res?.paid;
      if (isMountedRef.current) {
        setStatus(paid ? 'paid' : 'unpaid');
        setError(null);
      }
      return paid;
    } catch (e: any) {
      if (isMountedRef.current) {
        setError(e?.response?.data?.message || e?.message || 'Failed to check payment status');
        setStatus('error');
      }
      return false;
    }
  }, [gigId, bookingId]);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      checkStatus();
    }, pollMs);
  }, [checkStatus, pollMs]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (initialCheck) {
      checkStatus();
    }
    if (autoStart) {
      startPolling();
    }
    return () => stopPolling();
  }, [checkStatus, startPolling, stopPolling, initialCheck, autoStart]);

  const payNow = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await paymentsApi.initPayment(gigId, bookingId);
      const url = res?.url;
      if (!url) throw new Error('Failed to get payment URL');
      window.location.href = url;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Payment init failed';
      const status = e?.response?.status;
      setError(status ? `${msg} (status ${status})` : msg);
    } finally {
      setLoading(false);
    }
  }, [gigId, bookingId]);

  return useMemo(() => ({ status, isPaid: status === 'paid', error, loading, payNow, refresh: checkStatus }), [status, error, loading, payNow, checkStatus]);
}

export default usePayment;
