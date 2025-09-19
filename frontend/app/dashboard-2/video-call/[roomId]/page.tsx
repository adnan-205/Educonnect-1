'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import JitsiMeeting from '@/components/JitsiMeeting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { bookingsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  Calendar,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

interface BookingDetails {
  _id: string;
  gig: {
    title: string;
    duration: number;
    teacher: {
      name: string;
      email: string;
    };
  };
  student: {
    name: string;
    email: string;
  };
  scheduledDate: string;
  scheduledTime: string;
  meetingRoomId: string;
  status: string;
}

export default function VideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roomId = params.roomId as string;

  useEffect(() => {
    if (session?.user && roomId) {
      fetchBookingDetails();
    }
  }, [session, roomId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingsApi.getMyBookings();
      const bookings = response.data || [];
      
      // Find booking with matching room ID
      const booking = bookings.find((b: any) => b.meetingRoomId === roomId);
      
      if (booking) {
        setBookingDetails(booking);
      } else {
        setError('Meeting not found or you do not have access to this meeting.');
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError('Failed to load meeting details.');
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingEnd = () => {
    toast({
      title: "Meeting Ended",
      description: "You have left the meeting."
    });
    router.push('/dashboard-2/my-classes');
  };

  const handleMeetingJoined = () => {
    toast({
      title: "Meeting Joined",
      description: "You have successfully joined the class!"
    });
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: timeString
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading meeting details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bookingDetails) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Meeting Access Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                {error || 'Unable to access this meeting.'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => router.push('/dashboard-2/my-classes')}
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to My Classes
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { date, time } = formatDateTime(bookingDetails.scheduledDate, bookingDetails.scheduledTime);
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
  const displayName = userRole === 'teacher' 
    ? bookingDetails.gig.teacher.name 
    : bookingDetails.student.name;
  const userEmail = userRole === 'teacher'
    ? bookingDetails.gig.teacher.email
    : bookingDetails.student.email;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard-2/my-classes')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Video Class</h1>
            <p className="text-muted-foreground">EduConnect Live Session</p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800">
          Live Meeting
        </Badge>
      </div>

      {/* Meeting Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {bookingDetails.gig.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Participants</p>
                <p className="text-muted-foreground">
                  {bookingDetails.gig.teacher.name} & {bookingDetails.student.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-muted-foreground">{date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Time & Duration</p>
                <p className="text-muted-foreground">{time} ({bookingDetails.gig.duration} min)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jitsi Meeting Component */}
      <JitsiMeeting
        roomId={roomId}
        displayName={displayName}
        userEmail={userEmail}
        onMeetingEnd={handleMeetingEnd}
        onMeetingJoined={handleMeetingJoined}
        gigTitle={bookingDetails.gig.title}
        teacherName={bookingDetails.gig.teacher.name}
        studentName={bookingDetails.student.name}
        scheduledTime={`${date} at ${time}`}
      />

      {/* Meeting Info */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              This is a secure EduConnect video session. 
              Your meeting is private and only accessible to enrolled participants.
            </p>
            <p className="mt-2">
              Room ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{roomId}</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
