import { beforeEach, describe, expect, it, vi } from 'vitest';
const { rpc, from, select, order, eq, range }=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn(),select:vi.fn(),order:vi.fn(),eq:vi.fn(),range:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc,from}}));
import { appointmentService as service, appointmentError, bookingTime, watDate } from '@/lib/services/appointment-service';
describe('Trusted appointment service',()=>{
 beforeEach(()=>{vi.clearAllMocks();rpc.mockResolvedValue({data:'booking-id',error:null});});
 it('uses explicit WAT dates across the UTC midnight boundary',()=>{
  expect(watDate(new Date('2026-11-06T23:30:00Z'))).toBe('2026-11-07');
  expect(bookingTime('2026-11-06T08:00:00Z')).toContain('9:00');
  expect(bookingTime('2026-11-06T08:00:00Z')).toContain('WAT');
 });
 it('submits an idempotency key and owned animal without client prices, actor or end time',async()=>{
  await service.request({serviceId:'service-id',serviceVersion:2,start:'2026-11-20T08:00:00Z',key:'request-key',animalId:'pet-id',kind:'pet',phone:' 08012345678 ',address:'',notes:' Note '});
  expect(rpc).toHaveBeenCalledExactlyOnceWith('request_provider_booking',{service_uuid:'service-id',expected_service_version:2,start_time:'2026-11-20T08:00:00Z',request_key:'request-key',animal_pet:'pet-id',contact_phone:'08012345678',visit_address:'',customer_notes:'Note'});
 });
 it('uses a farm-group identifier rather than a pet identifier for livestock',async()=>{
  await service.request({serviceId:'service-id',serviceVersion:2,start:'2026-11-20T08:00:00Z',key:'request-key',animalId:'group-id',kind:'farm_group',phone:'08012345678',address:'',notes:''});
  expect(rpc.mock.calls[0]?.[1]).toMatchObject({animal_batch:'group-id'});
  expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty('animal_pet');
 });
 it('protects status and schedule changes with their reviewed versions',async()=>{
  await service.respond({id:'booking-id',version:4},'confirmed',' Checked ');
  expect(rpc).toHaveBeenCalledWith('respond_provider_booking',{booking_uuid:'booking-id',expected_version:4,decision:'confirmed',response_note:'Checked'});
  await service.saveSchedule('org-id',true,[{weekday:1,opens:540,closes:1020}],[],3);
  expect(rpc).toHaveBeenLastCalledWith('save_provider_booking_schedule',{provider_uuid:'org-id',enabled:true,weekly:[{weekday:1,opens:540,closes:1020}],closed_dates:[],expected_version:3});
 });
 it('scopes customer lists explicitly even for administrators with broader read permissions',async()=>{
  from.mockReturnValue({select});select.mockReturnValue({order});order.mockReturnValue({order,eq});eq.mockReturnValue({range});range.mockResolvedValue({data:[],error:null});
  expect(await service.list({customerId:'customer-id'},0)).toEqual({rows:[],hasNext:false});
  expect(eq).toHaveBeenCalledWith('customer_id','customer-id');expect(range).toHaveBeenCalledWith(0,20);
 });
 it('retains recorded bookings when provider approval cannot be rechecked',async()=>{
  from.mockReturnValue({select});select.mockReturnValue({order});order.mockReturnValue({order,eq});eq.mockReturnValue({range});range.mockResolvedValue({data:[{id:'booking-id',provider_id:'org-id'}],error:null});rpc.mockResolvedValue({data:null,error:{code:'42501'}});
  const result=await service.list({customerId:'customer-id'},0);expect(result.rows[0]?.id).toBe('booking-id');expect(result.rows[0]?.provider_eligibility).toBe('unknown');
 });
 it('preserves slot-race failures and fails closed on slot lookup errors',async()=>{
  rpc.mockResolvedValue({data:null,error:{code:'23P01'}});
  await expect(service.slots('service-id','2026-11-20')).rejects.toEqual({code:'23P01'});
  expect(appointmentError({code:'23P01'})).toContain('no longer available');
 });
});
