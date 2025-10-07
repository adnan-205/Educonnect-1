"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const tranId = params?.get("tran_id");

  return (
    <div className="container mx-auto max-w-xl px-4 py-10">
      <Card>
        <CardHeader className="text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
          <CardTitle>Payment Successful</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">Your payment has been received. You can now join your class when it starts.</p>
          {tranId && (
            <div className="text-xs text-gray-500">Transaction ID: {tranId}</div>
          )}
          <div className="flex justify-center gap-3">
            <Button onClick={() => router.push("/dashboard-2/join-class")}>Go to Join Class</Button>
            <Button variant="outline" onClick={() => router.push("/dashboard-2")}>Back to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
