import { describe, it, expect } from 'vitest';
import { providerService } from '@/lib/services/provider-service';

describe('Phase 1 Provider Organization Service', () => {
  it('exports providerService with expected API methods', () => {
    expect(providerService).toBeDefined();
    expect(typeof providerService.createOrganization).toBe('function');
    expect(typeof providerService.getUserOrganizations).toBe('function');
    expect(typeof providerService.getOrganizationBySlug).toBe('function');
    expect(typeof providerService.addStaffMember).toBe('function');
  });
});
