import { describe, it, expect, vi, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { api } from '@/services/api';

const mock = new MockAdapter(api);

describe('api interceptors', () => {
  beforeEach(() => {
    mock.reset();
    // Simulate stored user with email for 401 retry path
    localStorage.setItem('user', JSON.stringify({ email: 'retry@example.com' }));
    localStorage.removeItem('token');
  });

  it('attaches Authorization header when token is present', async () => {
    localStorage.setItem('token', 'abc123');
    mock.onGet('/gigs').reply((config: any) => {
      expect((config.headers as any)?.Authorization).toBe('Bearer abc123');
      return [200, { ok: true }];
    });
    const res = await api.get('/gigs');
    expect(res.status).toBe(200);
  });

  it('attempts 401 retry via /auth/clerk-sync and retries original request', async () => {
    // First call to /protected returns 401
    mock.onGet('/protected').replyOnce(401);

    // clerk-sync returns new token
    mock.onPost('/auth/clerk-sync').reply(200, { token: 'NEW_TOKEN' });

    // Second attempt to /protected succeeds
    mock.onGet('/protected').reply(200, { success: true });

    const res = await api.get('/protected');
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ success: true });
  });
});
