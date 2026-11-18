import {licenseBelongsToApplicant} from './license-service';
import {supabase} from '@/integrations/supabase/client';
export interface PendingVet {
 user_id:string;id:string;first_name:string;last_name:string;email:string|null;
 license_number:string|null;license_url:string|null;created_at:string;vendor_type:string|null;
}
export interface IncompleteVet extends PendingVet {
 missingRequirements: string[];
}
export function missingVetRequirements(profile: PendingVet): string[] {
 const missing: string[] = [];
 if (!profile.license_number?.trim()) missing.push('Licence number');
 if (!licenseBelongsToApplicant(profile.license_url, profile.user_id)) missing.push('Valid applicant-owned licence document');
 return missing;
}
/** Match is_verified_veterinarian: role + active profile + approved + verified licence. */
export const adminVetSummaryService={
 async load(){
  let approvedCount=0;const pendingVets:PendingVet[]=[];const incompleteVets:IncompleteVet[]=[];const seen=new Set<string>();
  const pageSize=100;
  for(let offset=0;;){
   const roles=await supabase.from('user_roles').select('user_id',{count:'exact'}).eq('role','veterinarian').order('user_id').range(offset,offset+pageSize-1);
   if(roles.error)throw roles.error;
   if(!roles.data||roles.count==null)throw new Error('Veterinarian accounts could not be checked.');
   if(!roles.data.length){if(offset<roles.count)throw new Error('Veterinarian account list is incomplete.');break;}
   const ids=[...new Set(roles.data.map(row=>row.user_id))].filter(id=>!seen.has(id));
   ids.forEach(id=>seen.add(id));
   if(ids.length){
    const [approved,pending]=await Promise.all([
     supabase.from('profiles').select('id',{count:'exact',head:true}).in('user_id',ids).eq('is_active',true).eq('verification_status','approved').eq('license_verified',true),
     supabase.from('profiles').select('id, user_id, first_name, last_name, email, license_number, license_url, created_at, vendor_type').in('user_id',ids).eq('verification_status','pending'),
    ]);
    if(approved.error)throw approved.error;
    if(pending.error)throw pending.error;
    if(approved.count==null||!pending.data)throw new Error('Veterinarian onboarding counts could not be checked.');
    approvedCount+=approved.count;
    for (const profile of pending.data) {
     const missingRequirements = missingVetRequirements(profile);
     if (missingRequirements.length) incompleteVets.push({...profile, missingRequirements});
     else pendingVets.push(profile);
    }
   }
   offset+=roles.data.length;
   if(offset>=roles.count)break;
  }
  pendingVets.sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
  incompleteVets.sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
  return {approvedCount,pendingVets,incompleteVets};
 },
};
