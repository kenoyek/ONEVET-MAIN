import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
export type TeamRole='manager'|'staff';
export const teamRoles={manager:'Manager',staff:'Booking coordinator'} as const;
export const teamRoleDescription={manager:'Manage services, publishing, schedules and booking requests.',staff:'Manage schedules and booking requests. No service editing or publishing.'} as const;
export type TeamMember=Database['public']['Functions']['list_provider_team']['Returns'][number];
export const teamInvitationSchema=z.object({email:z.string().trim().email().max(254),role:z.enum(['manager','staff'])}).strict();
export function teamError(error:unknown){
 if(error instanceof z.ZodError)return error.issues[0]?.message ?? 'Check the invitation details.';
 if(typeof error==='object'&&error&&'code'in error){
  if(error.code==='40001')return 'Team access or this invitation changed. Refresh before trying again.';
  if(error.code==='42501')return 'This action is unavailable. Check your account, verified email and current organization permissions.';
  if(error.code==='23505')return 'A pending invitation for this email already exists. Review or revoke it first.';
  if(error.code==='23514')return 'The team or pending-invitation limit was reached. Contact support or manage existing access.';
  if(error.code==='22023')return 'Choose a valid email and a supported team role. Ownership cannot be changed here.';
 }
 return 'Could not save the change. Your entries are still here; please try again.';
}
export const providerTeamService={
 async access(providerId:string){
  const [workspace,services,bookings]=await Promise.all([supabase.rpc('has_provider_team_access',{provider_uuid:providerId,capability:'workspace'}),supabase.rpc('has_provider_team_access',{provider_uuid:providerId,capability:'services'}),supabase.rpc('has_provider_team_access',{provider_uuid:providerId,capability:'bookings'})]);
  for(const result of [workspace,services,bookings])if(result.error)throw result.error;
  return {workspace:workspace.data===true,services:services.data===true,bookings:bookings.data===true};
 },
 async workspaces(){const {data,error}=await supabase.rpc('list_provider_workspaces');if(error)throw error;return data;},
 async invitations(){const {data,error}=await supabase.rpc('list_provider_team_invitations');if(error)throw error;return data;},
 async members(providerId:string){const {data,error}=await supabase.rpc('list_provider_team',{provider_uuid:providerId});if(error)throw error;return data;},
 async pending(providerId:string){const {data,error}=await supabase.from('provider_team_invitations').select('*').eq('provider_id',providerId).eq('status','pending').order('created_at',{ascending:false}).limit(50);if(error)throw error;return data;},
 async invite(providerId:string,input:{email:string;role:TeamRole}){const values=teamInvitationSchema.parse(input);const {data,error}=await supabase.rpc('invite_provider_team_member',{provider_uuid:providerId,email_address:values.email,requested_role:values.role});if(error)throw error;return data;},
 async respond(invitation:{id:string;version:number},decision:'accept'|'decline'){const {data,error}=await supabase.rpc('respond_provider_team_invitation',{invitation_uuid:invitation.id,expected_version:invitation.version,decision});if(error)throw error;return data;},
 async revoke(invitation:{id:string;version:number}){const {error}=await supabase.rpc('revoke_provider_team_invitation',{invitation_uuid:invitation.id,expected_version:invitation.version});if(error)throw error;},
 async update(member:Pick<TeamMember,'id'|'version'>,role:TeamRole,active:boolean){const {error}=await supabase.rpc('update_provider_team_member',{member_uuid:member.id,expected_version:member.version,requested_role:role,active});if(error)throw error;},
};
