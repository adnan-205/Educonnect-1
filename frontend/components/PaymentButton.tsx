"use client";

import { useState } from "react";
import { paymentsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PaymentButtonProps {
  gigId: string;
  amount?: number; // display-only; backend derives price securely
  className?: string;
}

export default function PaymentButton({ gigId, amount, className }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await paymentsApi.initPayment(gigId);
      const url = res?.url;
      if (!url) throw new Error("Failed to get payment URL");
      window.location.href = url;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Payment init failed";
      const status = e?.response?.status;
      setError(status ? `${msg} (status ${status})` : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button onClick={handlePay} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
        {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting...</>) : `Pay Now${typeof amount === 'number' ? ` (৳${amount})` : ''}`}
      </Button>
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
}
