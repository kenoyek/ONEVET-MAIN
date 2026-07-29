import { describe, it, expect } from 'vitest';
import { verificationService } from '@/lib/services/verification-service';

describe('Phase 2 Provider Verification & Compliance Service', () => {
  it('exports verificationService with expected API methods', () => {
    expect(verificationService).toBeDefined();
    expect(typeof verificationService.submitVerificationCase).toBe('function');
    expect(typeof verificationService.uploadProviderDocument).toBe('function');
    expect(typeof verificationService.getProviderDocuments).toBe('function');
    expect(typeof verificationService.getVerificationQueue).toBe('function');
    expect(typeof verificationService.reviewVerificationCase).toBe('function');
  });
});
