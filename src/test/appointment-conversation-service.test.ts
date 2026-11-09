import {beforeEach,describe,expect,it,vi} from 'vitest';
const {rpc,from,select,eq,order,lt,range}=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn(),select:vi.fn(),eq:vi.fn(),order:vi.fn(),lt:vi.fn(),range:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc,from}}));
import {appointmentConversationService as service} from '@/lib/services/appointment-conversation-service';
describe('Scoped appointment conversation service',()=>{
 beforeEach(()=>{vi.clearAllMocks();rpc.mockResolvedValue({data:'message-id',error:null});});
 it('sends only booking, normalized content and retry nonce, never a caller-supplied sender',async()=>{
  await service.send('booking-id','  Arrival question  ','nonce');expect(rpc).toHaveBeenCalledExactlyOnceWith('send_booking_message',{booking_uuid:'booking-id',message_text:'Arrival question',client_nonce:'nonce'});
 });
 it('rejects empty and oversized text before networking',async()=>{
  await expect(service.send('booking-id',' \n\t ','nonce')).rejects.toEqual({code:'22023'});await expect(service.send('booking-id','x'.repeat(2001),'nonce')).rejects.toEqual({code:'22023'});expect(rpc).not.toHaveBeenCalled();
 });
 it('does not turn missing or denied state into a fake empty conversation',async()=>{
  rpc.mockResolvedValue({data:[],error:null});await expect(service.state('booking-id')).rejects.toThrow('unavailable');rpc.mockResolvedValue({data:null,error:{code:'42501'}});await expect(service.state('booking-id')).rejects.toEqual({code:'42501'});
 });
 it('uses bounded thread-local pagination and chronological display order',async()=>{
  const builder={select,eq,order,lt,range};from.mockReturnValue(builder);for(const method of [select,eq,order,lt])method.mockReturnValue(builder);range.mockResolvedValue({data:Array.from({length:31},(_,index)=>({ordinal:60-index})),error:null});const result=await service.messages('booking-id',61);expect(eq).toHaveBeenCalledWith('booking_id','booking-id');expect(lt).toHaveBeenCalledWith('ordinal',61);expect(range).toHaveBeenCalledWith(0,30);expect(result.rows[0]?.ordinal).toBe(31);expect(result.rows.at(-1)?.ordinal).toBe(60);expect(result.hasOlder).toBe(true);
 });
 it('acknowledges only the selected thread and visible ordinal',async()=>{
  await service.markRead('booking-id',7);expect(rpc).toHaveBeenCalledExactlyOnceWith('mark_booking_thread_read',{booking_uuid:'booking-id',through_ordinal:7});
 });
});
