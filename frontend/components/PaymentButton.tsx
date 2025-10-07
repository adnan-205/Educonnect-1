"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";

interface PaymentButtonProps {
  gigId: string;
  bookingId?: string; // link payment to booking for tracking
  amount?: number; // display-only; backend derives price securely
  className?: string; // wrapper div class
  buttonClassName?: string; // inner Button class to control width/height
}

export default function PaymentButton({ gigId, bookingId, amount, className, buttonClassName }: PaymentButtonProps) {
  // Disable auto polling to avoid background GET timeouts; parent components can check status themselves
  const { payNow, loading, error } = usePayment({ gigId, bookingId, autoStart: false, initialCheck: false });

  return (
    <div className={className}>
      <Button onClick={payNow} disabled={loading} className={`${buttonClassName ?? ''} bg-indigo-600 hover:bg-indigo-700`}>
        {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting...</>) : `Pay Now${typeof amount === 'number' ? ` (৳${amount})` : ''}`}
      </Button>
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
}
