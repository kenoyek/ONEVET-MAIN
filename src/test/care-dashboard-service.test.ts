import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({calls:[] as {method:string;args:unknown[]}[],result:{data:[] as unknown[],error:null as unknown},from:vi.fn(),rpc:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:mock.from,rpc:mock.rpc}}));
import {careDashboardService as service,careDashboardWindow} from '@/lib/services/care-dashboard-service';
beforeEach(()=>{mock.rpc.mockReset();mock.rpc.mockResolvedValue({data:true,error:null});mock.calls=[];mock.result={data:[],error:null};const builder:Record<string,unknown>={};for(const method of ['select','eq','in','gte','lte','is','order'])builder[method]=(...args:unknown[])=>{mock.calls.push({method,args});return builder;};builder.limit=(...args:unknown[])=>{mock.calls.push({method:'limit',args});return Promise.resolve(mock.result);};mock.from.mockReturnValue(builder);});
describe('Care dashboard queries',()=>{
 it('uses the Lagos date across the UTC midnight boundary and adds 30 calendar days',()=>{expect(careDashboardWindow(new Date('2026-12-31T23:30:00Z'))).toEqual({now:'2026-12-31T23:30:00.000Z',today:'2027-01-01',through:'2027-01-31'});expect(careDashboardWindow(new Date('2028-02-01T12:00:00Z')).through).toBe('2028-03-02');});
 it('limits appointment previews to the authenticated customer and open future-ended bookings',async()=>{await service.appointments('user-a');expect(mock.from).toHaveBeenCalledWith('provider_booking_requests');expect(mock.calls).toEqual(expect.arrayContaining([{method:'eq',args:['customer_id','user-a']},{method:'in',args:['status',['pending','confirmed']]},{method:'gte',args:['end_at',expect.any(String)]},{method:'order',args:['start_at']},{method:'order',args:['id']},{method:'limit',args:[5]}]));expect(mock.calls.find(call=>call.method==='select')?.args[0]).not.toMatch(/contact_phone|customer_notes|visit_address/);});
 it('excludes corrected and future-window vaccination entries using current pet ownership',async()=>{await service.vaccinationDates('profile-a');expect(mock.calls).toEqual(expect.arrayContaining([{method:'eq',args:['pets.owner_id','profile-a']},{method:'eq',args:['entry_type','vaccination']},{method:'is',args:['voided_at',null]},{method:'lte',args:['next_due_on',careDashboardWindow().through]},{method:'order',args:['next_due_on']} ]));expect(mock.calls.find(call=>call.method==='select')?.args[0]).toContain('pets!inner(name,owner_id)');});
 it('orders recent observations by date with stable tie breakers and no note body',async()=>{await service.observations('profile-a');expect(mock.calls.filter(call=>call.method==='order').map(call=>call.args)).toEqual([['occurred_on',{ascending:false}],['created_at',{ascending:false}],['id']]);expect(mock.calls).toContainEqual({method:'is',args:['voided_at',null]});expect(mock.calls.find(call=>call.method==='select')?.args[0]).not.toContain('notes');});
 it('uses a lookahead row without presenting a preview as a total',async()=>{mock.result.data=Array.from({length:5},(_,i)=>({id:String(i)}));expect(await service.observations('profile-a')).toEqual({rows:[{id:'0'},{id:'1'},{id:'2'},{id:'3'}],hasMore:true});});
 it('propagates backend errors instead of claiming empty results',async()=>{mock.result={data:[],error:{code:'42501'}};await expect(service.appointments('user-a')).rejects.toMatchObject({code:'42501'});await expect(service.vaccinationDates('profile-a')).rejects.toMatchObject({code:'42501'});await expect(service.observations('profile-a')).rejects.toMatchObject({code:'42501'});});
});

it('checks each preview provider once and skips the lookahead provider',async()=>{
 mock.result.data=[{id:'1',provider_id:'a'},{id:'2',provider_id:'a'},{id:'3',provider_id:'b'},{id:'4',provider_id:'c'},{id:'5',provider_id:'lookahead'}];
 const result=await service.appointments('user-a');expect(result.rows).toHaveLength(4);expect(result.hasMore).toBe(true);expect(mock.rpc).toHaveBeenCalledTimes(3);
 expect(mock.rpc).not.toHaveBeenCalledWith('provider_publication_eligible',{provider_uuid:'lookahead'});
 expect(result.rows.every(row=>row.provider_eligibility==='eligible')).toBe(true);
});
it('retains recorded appointments while distinguishing unavailable and unknown approval',async()=>{
 mock.result.data=[{id:'1',provider_id:'inactive'},{id:'2',provider_id:'failed'},{id:'3',provider_id:'offline'},{id:'4',provider_id:'missing'}];
 mock.rpc.mockImplementation((_name:string,args:{provider_uuid:string})=>args.provider_uuid==='offline'?Promise.reject(new Error('Offline')):Promise.resolve(args.provider_uuid==='inactive'?{data:false,error:null}:args.provider_uuid==='failed'?{data:null,error:{code:'503'}}:{data:null,error:null}));
 const result=await service.appointments('user-a');expect(result.rows.map(row=>row.provider_eligibility)).toEqual(['unavailable','unknown','unknown','unknown']);expect(result.rows).toHaveLength(4);
});
it('makes no approval requests for an empty appointment preview',async()=>{
 expect(await service.appointments('user-a')).toEqual({rows:[],hasMore:false});expect(mock.rpc).not.toHaveBeenCalled();
});
