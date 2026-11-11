import { describe, expect, it } from 'vitest';
import { animalProfileToday, validAnimalBirthDate } from '@/lib/animal-profile-rules';
import { petSchema } from '@/lib/validation';
const animal={name:'Bello',species:'dog',isLivestock:false};
describe('animal profile data',()=>{
 it('uses the Lagos calendar day without shifting a stored birth date',()=>{
  expect(animalProfileToday(new Date('2026-11-10T23:30:00Z'))).toBe('2026-11-11');
  expect(validAnimalBirthDate('2024-02-29','2026-11-11')).toBe(true);
  for(const date of ['2025-02-29','2026-02-31','2026-11-12','not a date'])expect(validAnimalBirthDate(date,'2026-11-11')).toBe(false);
  expect(validAnimalBirthDate('','2026-11-11')).toBe(true);
 });
 it('keeps optional unknown values blank and rejects zero, negative or invalid weight',()=>{
  expect(petSchema.safeParse(animal).success).toBe(true);
  for(const weight of [0,-1,NaN,Infinity])expect(petSchema.safeParse({...animal,weight}).success).toBe(false);
  expect(petSchema.parse({...animal,weight:0.025}).weight).toBe(0.025);
 });
 it('requires whole positive livestock counts instead of silently truncating them',()=>{
  for(const livestockCount of [undefined,0,1.5,2147483648])expect(petSchema.safeParse({...animal,isLivestock:true,livestockCount}).success).toBe(false);
  expect(petSchema.parse({...animal,isLivestock:true,livestockCount:25}).livestockCount).toBe(25);
 });
});
