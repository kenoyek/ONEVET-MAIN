import { describe, it, expect } from 'vitest';
import { petPassportService } from '@/lib/services/pet-passport-service';

describe('Phase 3 Enhanced Pet Health Passport Service', () => {
  it('exports petPassportService with expected API methods', () => {
    expect(petPassportService).toBeDefined();
    expect(typeof petPassportService.getPetPassport).toBe('function');
    expect(typeof petPassportService.addAllergy).toBe('function');
    expect(typeof petPassportService.addCondition).toBe('function');
    expect(typeof petPassportService.addMedication).toBe('function');
    expect(typeof petPassportService.addVaccination).toBe('function');
    expect(typeof petPassportService.logWeight).toBe('function');
    expect(typeof petPassportService.logTimelineEvent).toBe('function');
    expect(typeof petPassportService.addCaregiver).toBe('function');
  });
});
