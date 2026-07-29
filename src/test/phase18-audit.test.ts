import { describe, it, expect } from 'vitest';
import { auditService } from '@/lib/services/audit-service';

describe('Phase 18 Audit Logging, Security Hardening & Compliance Service', () => {
  it('exports auditService with expected API methods', () => {
    expect(auditService).toBeDefined();
    expect(typeof auditService.logPlatformAction).toBe('function');
    expect(typeof auditService.logPetDataAccess).toBe('function');
  });
});
