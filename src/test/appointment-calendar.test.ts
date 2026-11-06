import { describe,expect,it } from 'vitest';
import { appointmentCalendar } from '@/lib/appointment-calendar';
import type { Appointment } from '@/lib/services/appointment-service';
const now=new Date('2026-11-07T07:00:00Z');
const booking:Appointment={id:'f1111111-1111-4111-8111-111111111111',customer_id:'customer-id',provider_owner_id:'provider-id',status:'confirmed',version:2,provider_eligibility:'eligible',start_at:'2026-11-07T08:00:00Z',end_at:'2026-11-07T08:45:00Z',updated_at:'2026-11-07T06:00:00Z',contact_phone:'PRIVATE-PHONE',visit_address:'PRIVATE-HOME',provider_address:'PRIVATE-CLINIC',customer_notes:'PRIVATE-CLINICAL-NOTE',animal_snapshot:{name:'PRIVATE-PET'},service_snapshot:{name:'PRIVATE-SERVICE'},base_fee:15000,batch_id:null,created_at:'2026-11-06T09:00:00Z',currency:'NGN',pet_id:'pet-id',provider_id:'org-id',service_id:'service-id',request_key:'request-key',replacement_for:null,replacement_version:null,reschedule_reason:'',response_note:''};
describe('Private appointment calendar copies',()=>{
 it('uses stable event identity, UTC instants and a private authenticated detail link',()=>{
  const first=appointmentCalendar(booking,'customer-id','https://onevet.example',now);
  expect(first).toContain('DTSTART:20261107T080000Z\r\n');expect(first).toContain('DTEND:20261107T084500Z\r\n');expect(first).toContain('CLASS:PRIVATE\r\n');expect(first).toContain('SEQUENCE:2\r\n');
  const unfolded=first.replace(/\r\n /g,'');expect(unfolded).toContain(`UID:${booking.id}@appointments.onevet.app\r\n`);expect(unfolded).toContain(`URL:https://onevet.example/appointments/${booking.id}\r\n`);expect(unfolded).not.toContain('ATTENDEE');expect(unfolded).not.toContain('VALARM');
 });
 it('omits all animal, contact, address, clinical and service labels',()=>{
  const calendar=appointmentCalendar(booking,'provider-id','https://onevet.example',now);expect(calendar).not.toContain('PRIVATE-');expect(calendar).toContain('SUMMARY:1Vet appointment');expect(calendar.replace(/\r\n /g,'')).toContain('does not update automatically');
 });
 it('folds lines to the RFC 5545 byte limit and uses CRLF throughout',()=>{
  const calendar=appointmentCalendar(booking,'customer-id','https://onevet.example',now);for(const line of calendar.split('\r\n'))expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);expect(calendar.replace(/\r\n/g,'')).not.toContain('\n');
 });
 it('refuses nonparticipants, pending/cancelled requests, expired events and unknown eligibility',()=>{
  expect(()=>appointmentCalendar(booking,'admin-observer','https://onevet.example',now)).toThrow('participants');
  for(const status of ['pending','cancelled','declined','completed'])expect(()=>appointmentCalendar({...booking,status},'customer-id','https://onevet.example',now)).toThrow();
  expect(()=>appointmentCalendar(booking,'customer-id','https://onevet.example',new Date('2026-11-08T00:00:00Z'))).toThrow();expect(()=>appointmentCalendar({...booking,provider_eligibility:'unknown'},'customer-id','https://onevet.example',now)).toThrow();
 });
 it('rejects injected identifiers, malformed time ranges and unsafe origins',()=>{
  expect(()=>appointmentCalendar({...booking,id:booking.id+'\r\nATTENDEE:bad'},'customer-id','https://onevet.example',now)).toThrow();
  expect(()=>appointmentCalendar({...booking,end_at:booking.start_at},'customer-id','https://onevet.example',now)).toThrow();expect(()=>appointmentCalendar({...booking,start_at:'invalid'},'customer-id','https://onevet.example',now)).toThrow();
  for(const origin of ['javascript:alert(1)','https://user:pass@example.com','https://onevet.example/path'])expect(()=>appointmentCalendar(booking,'customer-id',origin,now)).toThrow();
 });
});
