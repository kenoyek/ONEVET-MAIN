import { describe, expect, it } from 'vitest';
import { getAuthReturnPath, getAccountHome, primaryAccountRole } from '@/lib/auth-navigation';
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

describe('Account portal priority',()=>{
 it('chooses administration regardless of database row order',()=>{expect(getAccountHome('pet_owner',['pet_owner','admin'])).toBe('/admin');expect(getAccountHome('veterinarian',['veterinarian','admin'])).toBe('/admin');expect(primaryAccountRole(['pet_owner','admin'])).toBe('admin');});
 it('chooses the veterinary portal for a veterinarian with an owner role',()=>{expect(getAccountHome('pet_owner',['pet_owner','veterinarian'])).toBe('/vet-dashboard');expect(primaryAccountRole(['pet_owner','veterinarian'])).toBe('veterinarian');});
 it('retains customer and service-provider portals without inventing privileged roles',()=>{expect(getAccountHome('service_provider')).toBe('/dashboard');expect(primaryAccountRole([])).toBeNull();expect(primaryAccountRole(['pet_owner'])).toBe('pet_owner');});
});
