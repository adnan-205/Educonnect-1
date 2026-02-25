"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import JitsiMeeting from "@/components/JitsiMeeting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { bookingsApi, reviewsApi } from "@/services/api";
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
  const [gigId, setGigId] = useState<string | null>(null);
  const [gigTitle, setGigTitle] = useState<string>("");
  const [teacherName, setTeacherName] = useState<string>("");
  const { toast } = useToast();

  // Review dialog state
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);

  useEffect(() => {
    if (!roomId) {
      router.replace("/dashboard");
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
        // Store gig details for review
        if (data?.gig?._id) setGigId(data.gig._id);
        if (data?.gig?.title) setGigTitle(data.gig.title);
        if (data?.gig?.teacher?.name) setTeacherName(data.gig.teacher.name);
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
          router.replace("/dashboard/bookings?pay=required");
        } else if (status === 403 || status === 404) {
          router.replace("/dashboard");
        } else {
          router.replace("/dashboard");
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

  const onMeetingEnd = async (reason: 'duration' | 'participant_left' | 'hangup' | 'unknown') => {
    console.log('Meeting ended with reason:', reason);
    setMeetingEnded(true);

    // Mark booking as completed
    if (bookingId) {
      try {
        await bookingsApi.updateBookingStatus(bookingId, 'completed');
      } catch (_) {
        // ignore errors
      }
    }

    // For students: show review dialog if class ended (duration timeout or participant left)
    if (roleForThisBooking === 'student' && gigId) {
      // Check if student already reviewed this gig
      try {
        const existing = await reviewsApi.getMyReviewForGig(gigId);
        if (!existing?.data) {
          // No existing review, show dialog
          setShowReviewDialog(true);
          return; // Don't redirect yet, wait for review
        }
      } catch (_) {
        // If check fails, still show dialog
        setShowReviewDialog(true);
        return;
      }
    }

    // For teachers or if already reviewed, redirect to dashboard
    router.push('/dashboard');
  };

  const handleSubmitReview = async () => {
    if (!gigId) return;
    
    setSubmittingReview(true);
    try {
      await reviewsApi.createReview(gigId, {
        rating: Math.min(5, Math.max(1, Number(reviewRating))),
        comment: reviewComment.trim() || undefined,
      });
      toast({ title: 'Review submitted', description: 'Thank you for your feedback!' });
      setShowReviewDialog(false);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit review';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSkipReview = () => {
    setShowReviewDialog(false);
    router.push('/dashboard');
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
            onMeetingEnd={onMeetingEnd}
            roleForThisBooking={roleForThisBooking || undefined}
            meetingPassword={meetingPassword}
          />
          )}
        </CardContent>
      </Card>

      <div className="mt-3 text-xs text-gray-500">
        The session will end automatically after {endAfterMinutes} minutes and you will be redirected back.
      </div>

      {/* Review Dialog for Students */}
      <Dialog open={showReviewDialog} onOpenChange={(open) => !open && handleSkipReview()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Class</DialogTitle>
            <DialogDescription>
              How was your class &quot;{gigTitle}&quot; with {teacherName}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Star Rating */}
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-8 w-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            {/* Comment */}
            <div className="space-y-2">
              <Label>Your feedback (optional)</Label>
              <Textarea
                placeholder="Share your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleSkipReview}>
              Skip
            </Button>
            <Button onClick={handleSubmitReview} disabled={submittingReview}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
