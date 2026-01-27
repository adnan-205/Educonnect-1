"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface JitsiMeetingProps {
  roomId: string;
  displayName?: string;
  userEmail?: string;
  endAfterMinutes?: number; // auto-end after N minutes from join; default 90
  onMeetingJoined?: () => void;
  onMeetingEnd?: (reason: 'duration' | 'participant_left' | 'hangup' | 'unknown') => void; // fires after hangup/close with reason
  className?: string;
  roleForThisBooking?: 'teacher' | 'student';
  meetingPassword?: string;
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
  endAfterMinutes = 90,
  onMeetingJoined,
  onMeetingEnd,
  className = "",
  roleForThisBooking,
  meetingPassword,
}: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinedRef = useRef<boolean>(false);
  const instanceRef = useRef<any>(null);
  const router = useRouter();
  const cleanupExecutedRef = useRef<boolean>(false);
  const hadMultipleParticipantsRef = useRef<boolean>(false); // Track if we ever had 2+ participants
  const endReasonRef = useRef<'duration' | 'participant_left' | 'hangup' | 'unknown'>('unknown');

  useEffect(() => {
    const raw = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";
    const sanitized = raw.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const isLocal =
      sanitized === "localhost" ||
      sanitized === "127.0.0.1" ||
      sanitized.startsWith("192.168.") ||
      sanitized.startsWith("10.");
    const scheme = isLocal ? "http" : "https";
    let chosenDomain = sanitized;

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if ((window as any).JitsiMeetExternalAPI) return resolve();
        const primary = document.createElement("script");
        primary.src = `${scheme}://${sanitized}/external_api.js`;
        primary.async = true;
        primary.onload = () => resolve();
        primary.onerror = () => {
          if (sanitized !== 'meet.jit.si') {
            const fallback = document.createElement("script");
            fallback.src = `https://meet.jit.si/external_api.js`;
            fallback.async = true;
            fallback.onload = () => { chosenDomain = 'meet.jit.si'; resolve(); };
            fallback.onerror = () => reject(new Error("Failed to load Jitsi API"));
            document.head.appendChild(fallback);
          } else {
            reject(new Error("Failed to load Jitsi API"));
          }
        };
        document.head.appendChild(primary);
      });

    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await loadScript();
        if (!containerRef.current) throw new Error("Container not found");

        // Dispose any previous instance and clear container to avoid duplicates
        try { instanceRef.current?.dispose?.(); } catch (_) {}
        try { api?.dispose?.(); } catch (_) {}
        setApi(null);
        try { if (containerRef.current) containerRef.current.innerHTML = ''; } catch (_) {}

        // Toolbar settings: always hide invite; students get a limited toolbar
        const baseToolbarButtons: string[] = [
          'microphone',
          'camera',
          'chat',
          'raisehand',
          'hangup',
        ];
        const teacherToolbarButtons: string[] = [
          // exclude 'invite' deliberately
          'microphone', 'camera', 'desktop', 'fullcreen', 'fodeviceselection',
          'hangup', 'chat', 'etherpad', 'shareaudio', 'toggle-camera', 'highlight',
          'select-background', 'mute-everyone', 'mute-video-everyone', 'security', 'raisehand'
        ].filter(btn => btn !== 'invite' && btn !== 'add-people');

        const toolbarButtons = (roleForThisBooking === 'teacher') ? teacherToolbarButtons : baseToolbarButtons;

        const options: any = {
          roomName: roomId,
          parentNode: containerRef.current,
          width: "100%",
          height: 650,
          userInfo: {
            displayName: displayName || "",
            email: userEmail || "",
          },
          configOverwrite: {
            prejoinPageEnabled: false, // legacy key still honored in many builds
            prejoinConfig: { enabled: false },
            requireDisplayName: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableInviteFunctions: true,
            disableSelfView: true,
          },
          interfaceConfigOverwrite: {
            DISPLAY_WELCOME_PAGE_CONTENT: false,
            DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
          },
          toolbarButtons,
        };

        const apiInstance = new (window as any).JitsiMeetExternalAPI(chosenDomain, options);
        setApi(apiInstance);
        instanceRef.current = apiInstance;

        // Track participant count and handle leave logic
        const LEAVE_TIMEOUT_MS = 30000; // 30 seconds wait after someone leaves
        
        const handleParticipantLeft = () => {
          // Only trigger countdown if we previously had multiple participants
          if (!hadMultipleParticipantsRef.current || !joinedRef.current) {
            console.log('Participant left but we never had multiple participants, ignoring...');
            return;
          }
          
          try {
            const participants = apiInstance.getParticipantsInfo();
            const count = participants ? participants.length : 0;
            console.log(`Participant left. Current count: ${count}`);
            
            // If only this user remains (count <= 1), start 30-second countdown
            if (count <= 1) {
              console.log('Only one participant remaining, starting 30-second countdown...');
              
              // Clear any existing leave timer
              if (leaveTimerRef.current) {
                clearTimeout(leaveTimerRef.current);
              }
              
              leaveTimerRef.current = setTimeout(() => {
                // Double-check participant count before ending
                try {
                  const currentParticipants = apiInstance.getParticipantsInfo();
                  if (currentParticipants && currentParticipants.length <= 1) {
                    console.log('30 seconds passed, ending call due to participant leaving...');
                    endReasonRef.current = 'participant_left';
                    apiInstance.executeCommand("hangup");
                  } else {
                    console.log('Someone rejoined, cancelling auto-end.');
                  }
                } catch (_) {
                  // If we can't check, end the call anyway
                  endReasonRef.current = 'participant_left';
                  try { apiInstance.executeCommand("hangup"); } catch (_) {}
                }
              }, LEAVE_TIMEOUT_MS);
            }
          } catch (_) {
            // API might not be ready
          }
        };
        
        const handleParticipantJoined = () => {
          console.log('Participant joined');
          
          // Clear any pending leave timer since someone joined
          if (leaveTimerRef.current) {
            console.log('Clearing leave timer - someone joined');
            clearTimeout(leaveTimerRef.current);
            leaveTimerRef.current = null;
          }
          
          try {
            const participants = apiInstance.getParticipantsInfo();
            const count = participants ? participants.length : 0;
            console.log(`Participant count after join: ${count}`);
            
            // Mark that we've had multiple participants (class actually started)
            if (count >= 2) {
              hadMultipleParticipantsRef.current = true;
              console.log('Class has started with multiple participants');
            }
          } catch (_) {}
        };

        apiInstance.addEventListener("videoConferenceJoined", () => {
          setIsLoading(false);
          joinedRef.current = true;
          onMeetingJoined?.();
          // Auto-apply meeting password if teacher (moderator)
          if (roleForThisBooking === 'teacher' && meetingPassword) {
            try { apiInstance.executeCommand('password', meetingPassword); } catch (_) {}
          }
          // Optional auto-end after N minutes from actual join
          const autoEndDisabled = process.env.NEXT_PUBLIC_JITSI_AUTO_END_DISABLED === 'true';
          if (!autoEndDisabled) {
            const ms = Math.max(1, endAfterMinutes) * 60 * 1000;
            endTimerRef.current = setTimeout(() => {
              console.log(`Class duration (${endAfterMinutes} min) ended, hanging up...`);
              endReasonRef.current = 'duration';
              try {
                apiInstance.executeCommand("hangup");
              } catch (_) {
                // ignore
              }
            }, ms);
          }
        });

        // Monitor participant join/leave events
        apiInstance.addEventListener('participantJoined', handleParticipantJoined);
        apiInstance.addEventListener('participantLeft', handleParticipantLeft);

        // Student: auto-submit password when required (if teacher has set one)
        apiInstance.addEventListener('passwordRequired', () => {
          if (meetingPassword) {
            try { apiInstance.executeCommand('password', meetingPassword); } catch (_) {}
          }
        });

        const handleClose = () => {
          // Avoid redirect loops if the conference never actually started
          if (!joinedRef.current) {
            return;
          }
          // Prevent duplicate cleanup
          if (cleanupExecutedRef.current) {
            return;
          }
          cleanupExecutedRef.current = true;

          if (endTimerRef.current) {
            clearTimeout(endTimerRef.current);
            endTimerRef.current = null;
          }
          if (leaveTimerRef.current) {
            clearTimeout(leaveTimerRef.current);
            leaveTimerRef.current = null;
          }
          onMeetingEnd?.(endReasonRef.current);
          // Also navigate back to dashboard as a convenience
          try {
            router.push("/dashboard");
          } catch (_) {
            // ignore navigation errors
          }
        };

        apiInstance.addEventListener("videoConferenceLeft", handleClose);
        apiInstance.addEventListener("readyToClose", handleClose);

        // Handle browser/tab close - ensure hangup is called
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          if (joinedRef.current && instanceRef.current) {
            try {
              instanceRef.current.executeCommand("hangup");
            } catch (_) {}
          }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Store cleanup function to remove listener later
        const cleanup = () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };

        // Return cleanup reference (will be called in the main useEffect cleanup)
        (apiInstance as any)._internalCleanup = cleanup;
      } catch (e: any) {
        setError(e?.message || "Failed to start meeting");
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      // Call stored cleanup if exists
      try { 
        const cleanup = (instanceRef.current as any)?._internalCleanup;
        if (cleanup) cleanup();
      } catch (_) {}
      try { instanceRef.current?.dispose?.(); } catch (_) {}
      try { api?.dispose?.(); } catch (_) {}
      instanceRef.current = null;
      cleanupExecutedRef.current = false;
      try { if (containerRef.current) containerRef.current.innerHTML = ''; } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className={className}>
      {isLoading && (
        <div className="flex items-center justify-center py-8 text-gray-600">
          Initializing meeting...
        </div>
      )}
      <div data-testid="jitsi-container" ref={containerRef} className="w-full rounded-lg overflow-hidden border border-gray-200" />
    </div>
  );
}
