import { describe, expect, it } from 'vitest';
import { getAuthReturnPath } from '@/lib/auth-navigation';
describe('Authentication return navigation', () => {
  it('preserves a requested booking and its query after authentication', () => {
    expect(
      getAuthReturnPath({
        from: {
          pathname: '/booking/new',
          search: '?service_id=123',
          hash: '#details',
        },
      }),
    ).toBe('/booking/new?service_id=123#details');
  });
  it('rejects external destinations, auth loops and malformed state', () => {
    for (const pathname of [
      'https://example.com',
      '//example.com',
      '/auth',
      '/auth/callback',
      '/AUTH',
      '/auth?mode=reset',
      '/booking\n/new',
      ' /dashboard',
      '/\\example.com',
    ]) {
      expect(getAuthReturnPath({ from: { pathname } })).toBeNull();
    }
    expect(getAuthReturnPath(null)).toBeNull();
    expect(getAuthReturnPath({ from: 'external' })).toBeNull();
  });
});
