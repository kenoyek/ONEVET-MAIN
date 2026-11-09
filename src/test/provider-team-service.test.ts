import { beforeEach,describe,expect,it,vi } from 'vitest';
const {rpc}=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc}}));
import {providerTeamService as service,teamInvitationSchema} from '@/lib/services/provider-team-service';
describe('Trusted provider-team client',()=>{
 beforeEach(()=>{rpc.mockReset();rpc.mockResolvedValue({data:'org-id',error:null});});
 it('creates role-bound email invitations without caller-supplied actor or target user IDs',async()=>{
  await service.invite('org-id',{email:' Member@example.invalid ',role:'staff'});expect(rpc).toHaveBeenCalledExactlyOnceWith('invite_provider_team_member',{provider_uuid:'org-id',email_address:'Member@example.invalid',requested_role:'staff'});
 });
 it('rejects owner roles and permission payloads before networking',()=>{
  expect(teamInvitationSchema.safeParse({email:'member@example.invalid',role:'owner'}).success).toBe(false);expect(teamInvitationSchema.safeParse({email:'member@example.invalid',role:'staff',permissions:['*']}).success).toBe(false);expect(rpc).not.toHaveBeenCalled();
 });
 it('passes reviewed versions for acceptance, revocation and membership changes',async()=>{
  await service.respond({id:'invite-id',version:2},'accept');expect(rpc).toHaveBeenCalledWith('respond_provider_team_invitation',{invitation_uuid:'invite-id',expected_version:2,decision:'accept'});await service.update({id:'member-id',version:3},'staff',false);expect(rpc).toHaveBeenCalledWith('update_provider_team_member',{member_uuid:'member-id',expected_version:3,requested_role:'staff',active:false});await service.revoke({id:'invite-id',version:4});expect(rpc).toHaveBeenCalledWith('revoke_provider_team_invitation',{invitation_uuid:'invite-id',expected_version:4});
 });
 it('fails closed when a capability lookup is unavailable',async()=>{
  rpc.mockImplementation((_name:string,args:{capability:string})=>Promise.resolve(args.capability==='services'?{data:null,error:{code:'offline'}}:{data:true,error:null}));await expect(service.access('org-id')).rejects.toEqual({code:'offline'});
 });
 it('does not infer service permissions from booking access',async()=>{
  rpc.mockImplementation((_name:string,args:{capability:string})=>Promise.resolve({data:args.capability!=='services',error:null}));expect(await service.access('org-id')).toEqual({workspace:true,bookings:true,services:false});
 });
});
