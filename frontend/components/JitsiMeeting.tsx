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
}: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinedRef = useRef<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";
    const isLocal =
      domain === "localhost" ||
      domain === "127.0.0.1" ||
      domain.startsWith("192.168.") ||
      domain.startsWith("10.");
    const scheme = isLocal ? "http" : "https";

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if ((window as any).JitsiMeetExternalAPI) return resolve();
        const script = document.createElement("script");
        script.src = `${scheme}://${domain}/external_api.js`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Jitsi API"));
        document.head.appendChild(script);
      });

    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await loadScript();
        if (!containerRef.current) throw new Error("Container not found");

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
          },
          interfaceConfigOverwrite: {
            DISPLAY_WELCOME_PAGE_CONTENT: false,
            DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
          },
        };

        const apiInstance = new (window as any).JitsiMeetExternalAPI(domain, options);
        setApi(apiInstance);

        apiInstance.addEventListener("videoConferenceJoined", () => {
          setIsLoading(false);
          joinedRef.current = true;
          onMeetingJoined?.();
          // Auto-end after N minutes from actual join
          const ms = Math.max(1, endAfterMinutes) * 60 * 1000;
          endTimerRef.current = setTimeout(() => {
            try {
              apiInstance.executeCommand("hangup");
            } catch (_) {
              // ignore
            }
          }, ms);
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
      try {
        api?.dispose?.();
      } catch (_) {}
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
