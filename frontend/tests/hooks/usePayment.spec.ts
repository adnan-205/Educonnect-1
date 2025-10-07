import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/services/api', () => ({
  paymentsApi: {
    getStatus: vi.fn().mockResolvedValue({ paid: false }),
    getBookingStatus: vi.fn().mockResolvedValue({ paid: true }),
    initPayment: vi.fn().mockResolvedValue({ url: 'https://gateway/pay' }),
  }
}));

import { usePayment } from '@/hooks/usePayment';

describe('usePayment', () => {
  beforeEach(() => {
    (global as any).location = { href: '' };
  });

  it('checks booking payment status on mount and sets isPaid', async () => {
    const { result } = renderHook(() => usePayment({ gigId: 'g1', bookingId: 'b1', autoStart: false, initialCheck: true }));

    // Let promises resolve
    await act(async () => {});

    expect(result.current.isPaid).toBe(true);
    expect(result.current.status).toBe('paid');
  });

  it('payNow redirects to gateway URL', async () => {
    const { result } = renderHook(() => usePayment({ gigId: 'g1', bookingId: 'b1', autoStart: false, initialCheck: false }));

    await act(async () => {
      await result.current.payNow();
    });

    expect((global as any).location.href).toContain('https://gateway/pay');
  });
});
