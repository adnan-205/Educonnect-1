"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import JitsiMeeting from "@/components/JitsiMeeting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function VideoCallPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const { user } = useUser();
  const search = useSearchParams();

  const roomId = params?.roomId || "";
  const displayName = useMemo(() => {
    return user?.fullName || user?.firstName || user?.username || "Guest";
  }, [user]);

  // Allow override via query (e.g., ?minutes=90)
  const minutesFromQuery = parseInt(search?.get("minutes") || "", 10);
  const [endAfterMinutes] = useState<number>(
    Number.isFinite(minutesFromQuery) && minutesFromQuery > 0 ? minutesFromQuery : 90
  );

  useEffect(() => {
    if (!roomId) {
      router.replace("/dashboard-2");
    }
  }, [roomId, router]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="text-sm text-gray-500">Room: {roomId}</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Class</CardTitle>
        </CardHeader>
        <CardContent>
          <JitsiMeeting
            roomId={roomId}
            displayName={displayName}
            userEmail={user?.primaryEmailAddress?.emailAddress}
            endAfterMinutes={endAfterMinutes}
          />
        </CardContent>
      </Card>

      <div className="mt-3 text-xs text-gray-500">
        The session will end automatically after {endAfterMinutes} minutes and you will be redirected back.
      </div>
    </div>
  );
}
