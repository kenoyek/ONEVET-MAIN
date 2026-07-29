import { describe, it, expect } from 'vitest';
import { emergencyService } from '@/lib/services/emergency-service';

describe('Phase 14 Emergency & 24/7 Care Dispatch System Service', () => {
  it('calculates triage score and priority level correctly', () => {
    const criticalTriage = emergencyService.calculateTriageScore({
      is_conscious: false, // +5
      is_breathing: true,
      has_bleeding: true, // +4
    });
    expect(criticalTriage.score).toBe(9);
    expect(criticalTriage.triageLevel).toBe('critical');

    const moderateTriage = emergencyService.calculateTriageScore({
      is_conscious: true,
      is_breathing: true,
      has_bleeding: false,
    });
    expect(moderateTriage.score).toBe(0);
    expect(moderateTriage.triageLevel).toBe('moderate');
  });

  it('exports emergencyService with expected API methods', () => {
    expect(emergencyService).toBeDefined();
    expect(typeof emergencyService.calculateTriageScore).toBe('function');
    expect(typeof emergencyService.createEmergencyDispatch).toBe('function');
    expect(typeof emergencyService.updateDispatchStatus).toBe('function');
  });
});
