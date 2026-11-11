import { describe, expect, it } from 'vitest';
import { bookingStatus } from '@/lib/booking-status';
const now=Date.parse('2026-11-11T08:00:00Z');
describe('appointment status guidance',()=>{
 it('distinguishes a pending request from a missed confirmation window',()=>{
  expect(bookingStatus('pending','2026-11-11T10:00:00Z','2026-11-11T11:00:00Z',now).label).toBe('Awaiting confirmation');
  const late=bookingStatus('pending','2026-11-11T08:15:00Z','2026-11-11T09:00:00Z',now);expect(late.label).toBe('Confirmation window passed');expect(late.text).toContain('not been cancelled automatically');
 });
 it('never treats a past confirmed appointment as completed automatically',()=>{
  expect(bookingStatus('confirmed','2026-11-10T08:00:00Z','2026-11-10T09:00:00Z',now).label).toBe('Past appointment · still open');
  expect(bookingStatus('confirmed','2026-11-12T08:00:00Z','2026-11-12T09:00:00Z',now).label).toBe('Confirmed');
 });
 it('gives distinct guidance for terminal states and unknown values',()=>{
  for(const status of ['cancelled','declined','completed'])expect(bookingStatus(status,'','',now).text.length).toBeGreaterThan(30);
  expect(bookingStatus('unknown','','',now).label).toBe('Status unavailable');
 });
});
