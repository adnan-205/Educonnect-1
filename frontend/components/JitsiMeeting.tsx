'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Settings,
  Users,
  MessageSquare,
  Share2,
  Maximize,
  X
} from 'lucide-react';

interface JitsiMeetingProps {
  roomId: string;
  displayName: string;
  userEmail?: string;
  onMeetingEnd?: () => void;
  onMeetingJoined?: () => void;
  className?: string;
  gigTitle?: string;
  teacherName?: string;
  studentName?: string;
  scheduledTime?: string;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function JitsiMeeting({
  roomId,
  displayName,
  userEmail,
  onMeetingEnd,
  onMeetingJoined,
  className = '',
  gigTitle,
  teacherName,
  studentName,
  scheduledTime
}: JitsiMeetingProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState(0);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);

  useEffect(() => {
    // Load Jitsi Meet External API script
    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(window.JitsiMeetExternalAPI);
          return;
        }

        const script = document.createElement('script');
        script.src = 'http://localhost/external_api.js'; // Use your Jitsi domain
        script.async = true;
        script.onload = () => resolve(window.JitsiMeetExternalAPI);
        script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'));
        document.head.appendChild(script);
      });
    };

    const initializeJitsi = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await loadJitsiScript();

        if (!jitsiContainerRef.current) {
          throw new Error('Jitsi container not found');
        }

        const domain = 'localhost'; // Use your Jitsi domain
        const options = {
          roomName: roomId,
          width: '100%',
          height: 500,
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: displayName,
            email: userEmail || '',
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            enableUserRolesBasedOnToken: false,
            enableEmailInStats: false,
            requireDisplayName: true,
            disableThirdPartyRequests: true,
            enableNoAudioDetection: true,
            enableNoisyMicDetection: true,
            toolbarButtons: [
              'microphone',
              'camera',
              'closedcaptions',
              'desktop',
              'fullscreen',
              'fodeviceselection',
              'hangup',
              'profile',
              'chat',
              'recording',
              'livestreaming',
              'etherpad',
              'sharedvideo',
              'settings',
              'raisehand',
              'videoquality',
              'filmstrip',
              'invite',
              'feedback',
              'stats',
              'shortcuts',
              'tileview',
              'videobackgroundblur',
              'download',
              'help',
              'mute-everyone',
              'security'
            ],
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: '',
            SHOW_POWERED_BY: false,
            DISPLAY_WELCOME_PAGE_CONTENT: false,
            DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
            APP_NAME: 'EduConnect Class',
            NATIVE_APP_NAME: 'EduConnect',
            PROVIDER_NAME: 'EduConnect',
            LANG_DETECTION: true,
            CONNECTION_INDICATOR_AUTO_HIDE_ENABLED: true,
            CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT: 5000,
            MAXIMUM_ZOOMING_COEFFICIENT: 1.3,
            FILM_STRIP_MAX_HEIGHT: 120,
            ENABLE_FEEDBACK_ANIMATION: false,
            DISABLE_VIDEO_BACKGROUND: false,
            HIDE_INVITE_MORE_HEADER: false,
            RECENT_LIST_ENABLED: false,
            OPTIMAL_BROWSERS: ['chrome', 'chromium', 'firefox', 'nwjs', 'electron', 'safari'],
          },
        };

        const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
        setApi(jitsiApi);

        // Event listeners
        jitsiApi.addEventListener('videoConferenceJoined', () => {
          setIsJoined(true);
          setIsLoading(false);
          onMeetingJoined?.();
        });

        jitsiApi.addEventListener('videoConferenceLeft', () => {
          setIsJoined(false);
          onMeetingEnd?.();
        });

        jitsiApi.addEventListener('participantJoined', () => {
          setParticipants(prev => prev + 1);
        });

        jitsiApi.addEventListener('participantLeft', () => {
          setParticipants(prev => Math.max(0, prev - 1));
        });

        jitsiApi.addEventListener('audioMuteStatusChanged', (event: any) => {
          setIsAudioOn(!event.muted);
        });

        jitsiApi.addEventListener('videoMuteStatusChanged', (event: any) => {
          setIsVideoOn(!event.muted);
        });

        jitsiApi.addEventListener('readyToClose', () => {
          onMeetingEnd?.();
        });

        // Handle errors
        jitsiApi.addEventListener('connectionFailed', () => {
          setError('Failed to connect to the meeting. Please check your internet connection.');
          setIsLoading(false);
        });

      } catch (err) {
        console.error('Error initializing Jitsi:', err);
        setError('Failed to initialize video meeting. Please try again.');
        setIsLoading(false);
      }
    };

    initializeJitsi();

    // Cleanup
    return () => {
      if (api) {
        api.dispose();
      }
    };
  }, [roomId, displayName, userEmail]);

  const handleEndMeeting = () => {
    if (api) {
      api.executeCommand('hangup');
    }
  };

  const toggleAudio = () => {
    if (api) {
      api.executeCommand('toggleAudio');
    }
  };

  const toggleVideo = () => {
    if (api) {
      api.executeCommand('toggleVideo');
    }
  };

  const toggleChat = () => {
    if (api) {
      api.executeCommand('toggleChat');
    }
  };

  if (error) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <X className="h-5 w-5" />
            Meeting Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Meeting Info Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{gigTitle || 'EduConnect Class'}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                {teacherName && (
                  <span>Teacher: <strong>{teacherName}</strong></span>
                )}
                {studentName && (
                  <span>Student: <strong>{studentName}</strong></span>
                )}
                {scheduledTime && (
                  <span>Time: <strong>{scheduledTime}</strong></span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {participants + 1} participant{participants !== 0 ? 's' : ''}
              </Badge>
              {isJoined && (
                <Badge className="bg-green-100 text-green-800">
                  Connected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Jitsi Meeting Container */}
      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex items-center justify-center h-96 bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Connecting to meeting...</p>
              </div>
            </div>
          )}
          
          <div 
            ref={jitsiContainerRef} 
            className={`w-full ${isLoading ? 'hidden' : 'block'}`}
            style={{ minHeight: '500px' }}
          />
        </CardContent>
      </Card>

      {/* Meeting Controls (Optional - Jitsi has its own controls) */}
      {isJoined && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant={isAudioOn ? "default" : "destructive"}
                size="sm"
                onClick={toggleAudio}
              >
                {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              
              <Button
                variant={isVideoOn ? "default" : "destructive"}
                size="sm"
                onClick={toggleVideo}
              >
                {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleChat}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndMeeting}
              >
                <PhoneOff className="h-4 w-4" />
                End Meeting
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
