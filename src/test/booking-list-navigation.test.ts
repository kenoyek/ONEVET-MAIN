import { describe, expect, it } from 'vitest';
import { bookingListFilters, bookingReturnPath } from '@/lib/booking-list-navigation';
describe('appointment list navigation',()=>{
 it('restores valid customer and provider views without mixing their parameters',()=>{
  const params=new URLSearchParams('view=past_open&page=2&booking_view=needs_response&booking_page=3');
  expect(bookingListFilters(params)).toEqual({view:'past_open',page:2});expect(bookingListFilters(params,true)).toEqual({view:'needs_response',page:3});
 });
 it('bounds pagination and ignores invalid shared filters',()=>{
  for(const page of ['-1','NaN','1.5','1000','1x'])expect(bookingListFilters(new URLSearchParams({view:'unknown',page}))).toEqual({view:'upcoming',page:0});
 });
 it('returns only to appointment lists or organization workspaces',()=>{
  expect(bookingReturnPath('/my-bookings?view=past_open&page=2')).toBe('/my-bookings?view=past_open&page=2');
  expect(bookingReturnPath('/provider/organization/care-clinic?booking_view=all')).toContain('care-clinic');
  for(const input of ['https://example.invalid','//example.invalid','/auth','/my-bookings#other','/my-bookings\\evil',null])expect(bookingReturnPath(input)).toBe('/my-bookings');
 });
});
