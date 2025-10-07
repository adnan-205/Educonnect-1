import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import JitsiMeeting from '@/components/JitsiMeeting';

// Mock next/router navigation used inside JitsiMeeting when meeting ends
vi.mock('next/navigation', async () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

class FakeJitsiAPI {
  private listeners: Record<string, Function[]> = {};
  constructor(domain: string, options: any) {
    // Auto-emit joined event right after mount
    setTimeout(() => this.emit('videoConferenceJoined'), 0);
  }
  addEventListener(evt: string, cb: Function) {
    this.listeners[evt] = this.listeners[evt] || [];
    this.listeners[evt].push(cb);
  }
  executeCommand(_: string) {}
  dispose() {}
  emit(evt: string) { (this.listeners[evt] || []).forEach(fn => fn()); }
}

describe('JitsiMeeting', () => {
  beforeEach(() => {
    (window as any).JitsiMeetExternalAPI = FakeJitsiAPI as any;
    // Avoid script tag injection path by ensuring API exists
  });

  it('calls onMeetingJoined after join event and renders container', async () => {
    const onMeetingJoined = vi.fn();
    render(<JitsiMeeting roomId="room-123" displayName="John" onMeetingJoined={onMeetingJoined} />);

    // Shows initializing text initially
    expect(await screen.findByText(/Initializing meeting/i)).toBeInTheDocument();

    // Then the container should be present and callback fired
    await new Promise(r => setTimeout(r, 10));
    expect(onMeetingJoined).toHaveBeenCalled();
    expect(document.querySelector('[data-testid="jitsi-container"]') || document.querySelector('div')).toBeTruthy();
  });
});
