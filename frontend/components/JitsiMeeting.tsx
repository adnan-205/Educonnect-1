"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface JitsiMeetingProps {
  roomId: string;
  displayName?: string;
  userEmail?: string;
  endAfterMinutes?: number; // auto-end after N minutes from join; default 90
  onMeetingJoined?: () => void;
  onMeetingEnd?: () => void; // fires after hangup/close
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
  const joinedRef = useRef<boolean>(false);
  const instanceRef = useRef<any>(null);
  const router = useRouter();

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
              try {
                apiInstance.executeCommand("hangup");
              } catch (_) {
                // ignore
              }
            }, ms);
          }
        });

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
          if (endTimerRef.current) {
            clearTimeout(endTimerRef.current);
            endTimerRef.current = null;
          }
          onMeetingEnd?.();
          // Also navigate back to dashboard as a convenience
          try {
            router.push("/dashboard-2");
          } catch (_) {
            // ignore navigation errors
          }
        };

        apiInstance.addEventListener("videoConferenceLeft", handleClose);
        apiInstance.addEventListener("readyToClose", handleClose);
      } catch (e: any) {
        setError(e?.message || "Failed to start meeting");
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
      try { instanceRef.current?.dispose?.(); } catch (_) {}
      try { api?.dispose?.(); } catch (_) {}
      instanceRef.current = null;
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
