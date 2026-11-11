import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:mocks.from}}));
import { livestockService as service } from '@/lib/services/livestock-service';
let stored:Record<string,unknown>;
function builder(){const q={insert:vi.fn(),select:vi.fn(),eq:vi.fn(),single:vi.fn(async()=>({data:null,error:{code:'23505'}})),maybeSingle:vi.fn(async()=>({data:stored,error:null}))};q.insert.mockImplementation(value=>{stored=value;return q;});q.select.mockReturnValue(q);q.eq.mockReturnValue(q);mocks.from.mockReturnValue(q);return q;}
beforeEach(()=>{vi.clearAllMocks();stored={};});
describe('farm record retry scopes',()=>{
 it('reuses the farm ID and recovers only the matching owner record',async()=>{
  const q=builder();const row=await service.registerFarm({owner_id:'owner',farm_name:'Farm',farm_type:'poultry',location_address:'Road',city:'Ibadan',state:'Oyo'},'farm-id');expect(row.id).toBe('farm-id');expect(q.eq).toHaveBeenCalledWith('id','farm-id');expect(q.eq).toHaveBeenCalledWith('owner_id','owner');expect(q.insert).toHaveBeenCalledTimes(1);
 });
 it('derives a stable group code from the ID and scopes recovery to its farm',async()=>{
  const q=builder();await service.createHerdBatch({farm_id:'farm',species:'poultry',head_count:50,housing_unit:'Layers'},'group-id');expect(stored.batch_code).toBe('OV-HERD-group-id');expect(q.eq).toHaveBeenCalledWith('farm_id','farm');
 });
 it('scopes observation recovery to the same group and recorder',async()=>{
  const q=builder();await service.logFlockHealthRecord({batch_id:'a1111111-1111-4111-8111-111111111111',recorded_by_id:'owner',record_type:'owner_observation',observations:'Eating normally',affected_count:0,mortality_count:0},'observation-id');expect(stored.id).toBe('observation-id');expect(q.eq).toHaveBeenCalledWith('recorded_by_id','owner');expect(q.eq).toHaveBeenCalledWith('batch_id','a1111111-1111-4111-8111-111111111111');
 });
});
