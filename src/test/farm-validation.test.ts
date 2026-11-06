import { describe, expect, it } from 'vitest';
import {
  farmSchema,
  batchSchema,
  observationSchema,
} from '@/lib/farm-validation';
describe('Farm input validation', () => {
  it('rejects whitespace names and missing service location', () => {
    expect(
      farmSchema.safeParse({
        farm_name: '   ',
        farm_type: 'poultry',
        location_address: '',
        city: 'Test',
        state: 'Test',
      }).success,
    ).toBe(false);
  });
  it('requires an integer group population and descriptive group name', () => {
    for (const head_count of [-1, 0, 1.5, Infinity])
      expect(
        batchSchema.safeParse({
          species: 'fish',
          housing_unit: 'Pond 1',
          head_count,
        }).success,
      ).toBe(false);
  });
  it('rejects forged batch identifiers and impossible mortality counts', () => {
    expect(
      observationSchema.safeParse({
        batch_id: 'foreign-id',
        observations: 'Test',
        affected_count: 1,
        mortality_count: 0,
      }).success,
    ).toBe(false);
    expect(
      observationSchema.safeParse({
        batch_id: 'a1000000-0000-4000-8000-000000000001',
        observations: 'Test',
        affected_count: 1,
        mortality_count: 2,
      }).success,
    ).toBe(false);
  });
});
