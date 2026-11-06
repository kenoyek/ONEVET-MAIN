import { beforeEach,describe,expect,it,vi } from 'vitest';
const {from,select,eq,order,range,update,rpc}=vi.hoisted(()=>({from:vi.fn(),select:vi.fn(),eq:vi.fn(),order:vi.fn(),range:vi.fn(),update:vi.fn(),rpc:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from,rpc}}));
import {inboxService,notificationDestination} from '@/lib/services/inbox-service';
describe('Recipient-scoped notification service',()=>{
 beforeEach(()=>{vi.clearAllMocks();});
 it('queries only the current recipient and paginates unread alerts',async()=>{
  const builder={select,eq,order,range};from.mockReturnValue(builder);for(const method of [select,eq,order])method.mockReturnValue(builder);range.mockResolvedValue({data:Array.from({length:21},(_,id)=>({id:String(id)})),error:null});
  const result=await inboxService.list('owner-id',1,20,true);expect(eq).toHaveBeenCalledWith('user_id','owner-id');expect(eq).toHaveBeenCalledWith('is_read',false);expect(range).toHaveBeenCalledWith(20,40);expect(result.rows).toHaveLength(20);expect(result.hasNext).toBe(true);
 });
 it('acknowledges only an unread alert belonging to that recipient',async()=>{
  const builder={update,eq,then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({error:null}).then(resolve)};from.mockReturnValue(builder);update.mockReturnValue(builder);eq.mockReturnValue(builder);
  await inboxService.markRead('owner-id','alert-id');expect(update).toHaveBeenCalledWith({is_read:true});expect(eq).toHaveBeenCalledWith('user_id','owner-id');expect(eq).toHaveBeenCalledWith('id','alert-id');expect(eq).toHaveBeenCalledWith('is_read',false);
 });
 it('does not interpret an empty individual ID as mark-all',async()=>{
  const builder={update,eq,then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({error:null}).then(resolve)};from.mockReturnValue(builder);update.mockReturnValue(builder);eq.mockReturnValue(builder);await inboxService.markRead('owner-id','');expect(eq).toHaveBeenCalledWith('id','');
 });
 it('fails rather than inventing an unread count on RPC errors',async()=>{
  rpc.mockResolvedValue({data:null,error:{code:'offline'}});await expect(inboxService.unread('owner-id')).rejects.toEqual({code:'offline'});rpc.mockResolvedValue({data:null,error:null});await expect(inboxService.unread('owner-id')).rejects.toThrow();
 });
 it('prefers structured booking links and rejects external or encoded destinations',()=>{
  const id='f1111111-1111-4111-8111-111111111111';expect(notificationDestination({booking_id:id,link:'https://evil.example'})).toBe(`/appointments/${id}`);
  for(const link of ['javascript:alert(1)','https://evil.example','//evil.example','/\\evil.example','/%2f%2fevil.example','/unknown-route','/notifications\n'])expect(notificationDestination({booking_id:null,link})).toBeNull();
  expect(notificationDestination({booking_id:null,link:'/my-bookings'})).toBe('/my-bookings');expect(notificationDestination({booking_id:null,link:'/provider/organization/our-clinic'})).toBe('/provider/organization/our-clinic');
 });
});
