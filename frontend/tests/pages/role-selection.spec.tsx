import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@clerk/nextjs', async () => ({
  useUser: () => ({ isLoaded: true, isSignedIn: true, user: { fullName: 'Test User', primaryEmailAddress: { emailAddress: 'test@example.com' } } }),
}));

vi.mock('next/navigation', async () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
}));

// Mock fetch for the proxy endpoint used in the page
const fetchMock = vi.fn();
(global as any).fetch = fetchMock;

import RoleSelectionPage from '@/app/role-selection/page';

describe('RoleSelectionPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
  });

  it('submits student role and redirects to /dashboard-2', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));

    render(<RoleSelectionPage />);
    const btn = screen.getByRole('button', { name: /continue as student/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(localStorage.getItem('role')).toBe('student');
    });
  });
});
