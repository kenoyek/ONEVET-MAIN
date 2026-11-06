import { afterEach, describe, expect, it, vi } from 'vitest';
import { plannedSupabase, ModuleUnavailableError } from '@/integrations/supabase/planned-client';
import { petPassportService } from '@/lib/services/pet-passport-service';
const mocks=vi.hoisted(()=>({single:vi.fn(),from:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:(name:string)=>{mocks.from(name);return {select:()=>({eq:()=>({maybeSingle:mocks.single})})};}}}));
afterEach(()=>vi.clearAllMocks());
describe('Deployed versus unreleased module boundary',()=>{
 it('rejects unreleased tables and RPCs before making any network request',()=>{const fetch=vi.spyOn(globalThis,'fetch');expect(()=>plannedSupabase.from('provider_organizations')).toThrow(ModuleUnavailableError);expect(()=>plannedSupabase.rpc('check_booking_slot_available',{_provider_id:'id',_start_at:'start',_end_at:'end'})).toThrow(ModuleUnavailableError);expect(fetch).not.toHaveBeenCalled();fetch.mockRestore();});
 it('loads the real core pet profile without querying undeployed passport tables',async()=>{mocks.single.mockResolvedValue({data:{id:'pet',name:'Fixture pet',medical_notes:'Existing core notes'},error:null});const data=await petPassportService.getPetPassport('pet');expect(data.pet?.name).toBe('Fixture pet');expect(data.pet?.medical_notes).toBe('Existing core notes');expect(data.advancedAvailable).toBe(false);expect(mocks.from).toHaveBeenCalledExactlyOnceWith('pets');});
 it('preserves a real core pet retrieval failure instead of returning an empty passport',async()=>{mocks.single.mockResolvedValue({data:null,error:new Error('permission denied')});await expect(petPassportService.getPetPassport('pet')).rejects.toThrow('permission denied');});
});
