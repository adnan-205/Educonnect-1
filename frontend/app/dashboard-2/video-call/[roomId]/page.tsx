"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import JitsiMeeting from "@/components/JitsiMeeting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { bookingsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

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

  // Authorization & payment guard
  const [verifying, setVerifying] = useState(true);
  const [deniedMsg, setDeniedMsg] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [roleForThisBooking, setRoleForThisBooking] = useState<'teacher' | 'student' | null>(null);
  const [meetingPassword, setMeetingPassword] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (!roomId) {
      router.replace("/dashboard-2");
      return;
    }
    // Verify that current user has access and (if student) has paid
    (async () => {
      try {
        setVerifying(true);
        setDeniedMsg(null);
        const result = await bookingsApi.getByRoom(roomId);
        const bk = (result && (result.data || result)) as any;
        const data = bk?.data || bk;
        const id = data?._id || null;
        if (id) setBookingId(id);
        const role = data?.roleForThisBooking;
        if (role === 'teacher' || role === 'student') setRoleForThisBooking(role);
        if (data?.meetingPassword) setMeetingPassword(data.meetingPassword);
        setVerifying(false);
      } catch (e: any) {
        setVerifying(false);
        const status = e?.response?.status;
        const msg = e?.response?.data?.message || e?.message;
        setDeniedMsg(msg || null);
        if (msg) {
          toast({ title: 'Unable to join', description: msg, variant: 'destructive' });
        }
        if (status === 402) {
          // Payment required
          router.replace("/dashboard-2/bookings?pay=required");
        } else if (status === 403 || status === 404) {
          router.replace("/dashboard-2");
        } else {
          router.replace("/dashboard-2");
        }
      }
    })();
  }, [roomId, router]);

  const onJoined = async () => {
    // Best-effort attendance marking only for students; backend also enforces
    try {
      if (bookingId && roleForThisBooking === 'student') {
        await bookingsApi.markAttendance(bookingId);
      }
    } catch (_) {
      // ignore attendance errors to not disrupt meeting
    }
  };

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
          {verifying ? (
            <div className="flex items-center justify-center py-12 text-gray-500 text-sm">Validating access...</div>
          ) : (
          <JitsiMeeting
            roomId={roomId}
            displayName={displayName}
            userEmail={user?.primaryEmailAddress?.emailAddress}
            endAfterMinutes={endAfterMinutes}
            onMeetingJoined={onJoined}
            roleForThisBooking={roleForThisBooking || undefined}
            meetingPassword={meetingPassword}
          />
          )}
        </CardContent>
      </Card>

      <div className="mt-3 text-xs text-gray-500">
        The session will end automatically after {endAfterMinutes} minutes and you will be redirected back.
      </div>
    </div>
  );
}
