import {supabase} from '@/integrations/supabase/client';
import {watDate} from '@/lib/services/appointment-service';

export function careDashboardWindow(now=new Date()){
 const today=watDate(now);
 const end=new Date(`${today}T00:00:00Z`);end.setUTCDate(end.getUTCDate()+30);
 return {now:now.toISOString(),today,through:end.toISOString().slice(0,10)};
}
function preview<T>(rows:T[]){return{rows:rows.slice(0,4),hasMore:rows.length>4};}
export const careDashboardService={
 async appointments(userId:string){
  const {data,error}=await supabase.from('provider_booking_requests')
   .select('id,status,start_at,end_at,service_snapshot')
   .eq('customer_id',userId).in('status',['pending','confirmed'])
   .gte('end_at',careDashboardWindow().now).order('start_at').order('id').limit(5);
  if(error)throw error;return preview(data);
 },
 async vaccinationDates(ownerId:string){
  const {data,error}=await supabase.from('pet_owner_health_entries')
   .select('id,pet_id,title,next_due_on,pets!inner(name,owner_id)')
   .eq('pets.owner_id',ownerId).eq('entry_type','vaccination').is('voided_at',null)
   .lte('next_due_on',careDashboardWindow().through).order('next_due_on').order('id').limit(5);
  if(error)throw error;return preview(data);
 },
 async observations(ownerId:string){
  const {data,error}=await supabase.from('pet_owner_health_entries')
   .select('id,pet_id,title,entry_type,occurred_on,weight_kg,pets!inner(name,owner_id)')
   .eq('pets.owner_id',ownerId).is('voided_at',null)
   .order('occurred_on',{ascending:false}).order('created_at',{ascending:false}).order('id').limit(5);
  if(error)throw error;return preview(data);
 },
};
