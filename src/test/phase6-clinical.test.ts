import { describe, it, expect } from 'vitest';
import { clinicalService } from '@/lib/services/clinical-service';

describe('Phase 6 Veterinary Consultation & Clinical Records Service', () => {
  it('exports clinicalService with expected API methods', () => {
    expect(clinicalService).toBeDefined();
    expect(typeof clinicalService.updateSOAPNotes).toBe('function');
    expect(typeof clinicalService.signClinicalSummary).toBe('function');
    expect(typeof clinicalService.issuePrescription).toBe('function');
    expect(typeof clinicalService.getPetPrescriptions).toBe('function');
  });
});
