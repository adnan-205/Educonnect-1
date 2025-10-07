import '@testing-library/jest-dom';

// Basic router mock for components that call useRouter()
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<any>('next/navigation');
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  };
});

// Clerk mock helpers (opt-in per test as needed)
vi.mock('@clerk/nextjs', async () => ({
  useUser: () => ({ isLoaded: true, isSignedIn: true, user: { fullName: 'Test User', primaryEmailAddress: { emailAddress: 'test@example.com' } } }),
}));

// JSDOM lacks matchMedia used by some UI libs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
