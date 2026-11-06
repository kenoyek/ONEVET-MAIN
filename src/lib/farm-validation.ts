import { z } from 'zod';

export const farmSchema = z.object({
  farm_name: z.string().trim().min(1, 'Enter a farm name').max(120),
  farm_type: z.enum([
    'poultry',
    'cattle',
    'goats_sheep',
    'pigs',
    'aquaculture',
    'mixed',
    'other',
  ]),
  location_address: z
    .string()
    .trim()
    .min(1, 'Enter a service location')
    .max(250),
  city: z.string().trim().min(1, 'Enter a city or local area').max(100),
  state: z.string().trim().min(1, 'Enter a state').max(100),
});
export const batchSchema = z.object({
  species: z.enum([
    'poultry',
    'cattle',
    'goat',
    'sheep',
    'pig',
    'fish',
    'other',
  ]),
  breed: z.string().trim().max(100).optional(),
  head_count: z.coerce
    .number()
    .int('Use a whole number')
    .min(1, 'Enter at least one animal')
    .max(10000000),
  purpose: z.string().trim().max(150).optional(),
  housing_unit: z
    .string()
    .trim()
    .min(1, 'Name this group, herd, flock or pond')
    .max(100),
});
export const observationSchema = z
  .object({
    batch_id: z.string().uuid('Choose an animal group'),
    observations: z
      .string()
      .trim()
      .min(1, 'Describe what you observed')
      .max(4000),
    affected_count: z.coerce.number().int().min(0).max(10000000),
    mortality_count: z.coerce.number().int().min(0).max(10000000),
  })
  .refine((v) => v.mortality_count <= v.affected_count, {
    message: 'Deaths cannot exceed the number of affected animals',
    path: ['mortality_count'],
  });
export type FarmValues = z.infer<typeof farmSchema>;
export type BatchValues = z.infer<typeof batchSchema>;
export type ObservationValues = z.infer<typeof observationSchema>;
