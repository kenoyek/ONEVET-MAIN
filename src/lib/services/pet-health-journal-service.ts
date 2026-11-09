import {supabase} from '@/integrations/supabase/client';
import type {Database} from '@/integrations/supabase/types';
export type OwnerHealthEntry=Database['public']['Tables']['pet_owner_health_entries']['Row'];
export type OwnerHealthInput={kind:'weight'|'vaccination'|'note';date:string;title:string;notes:string;weight:number|null;dueDate:string|null};
export function journalError(error:unknown){
 if(error&&typeof error==='object'&&'code'in error){
  if(error.code==='42501')return 'This pet journal is unavailable for this account. Refresh to check your access.';
  if(error.code==='22023')return 'Check the entry date, title, weight and due date. Future observations cannot be recorded.';
  if(error.code==='23514')return 'The daily journal limit was reached. Please try again later.';
 }
 return 'Could not confirm the change. Your entries are retained. Retry the same entry to avoid duplicates.';
}
export function journalDueLabel(date:string,today:string){return date<today?'Past owner-supplied due date':date===today?'Owner-supplied due date today':'Owner-supplied due date';}
export const petHealthJournalService={
 async access(petId:string){const{data,error}=await supabase.rpc('can_manage_pet_health_journal',{pet_uuid:petId});if(error)throw error;if(data!==true)throw{code:'42501'};return true;},
 async list(petId:string,page:number){
  const{data,error}=await supabase.from('pet_owner_health_entries').select('*').eq('pet_id',petId).order('occurred_on',{ascending:false}).order('created_at',{ascending:false}).order('id').range(page*20,page*20+20);
  if(error)throw error;return{rows:data.slice(0,20),hasNext:data.length>20};
 },
 async add(petId:string,input:OwnerHealthInput,key:string){
  const{data,error}=await supabase.rpc('add_pet_owner_health_entry',{pet_uuid:petId,entry_kind:input.kind,event_date:input.date,entry_title:input.title.trim(),entry_notes:input.notes.trim(),weight_value:input.weight,due_date:input.dueDate,request_key:key});
  if(error)throw error;if(!data)throw new Error('Journal result unavailable');return data;
 },
 async voidEntry(entryId:string,reason:string){const{error}=await supabase.rpc('void_pet_owner_health_entry',{entry_uuid:entryId,reason:reason.trim()});if(error)throw error;},
};
