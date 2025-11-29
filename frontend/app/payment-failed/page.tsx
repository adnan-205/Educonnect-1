"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentFailedPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-xl px-4 py-10">
      <Card>
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
          <CardTitle>Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">We couldn't process your payment. You can try again.</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => router.push("/dashboard/join-class")}>Back to Join Class</Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
