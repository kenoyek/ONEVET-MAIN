import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/auth-context';
import {supabase} from '@/integrations/supabase/client';

export function useCustomerOverview(){
 const {user,profile}=useAuth();
 const ownerId=profile?.user_id===user?.id?profile?.id:undefined;
 const enabled=!!user?.id&&!!ownerId;
 const key=['customer-overview',user?.id,ownerId];
 const pets=useQuery({queryKey:[...key,'pets'],enabled,queryFn:async()=>{
  const result=await supabase.from('pets').select('id,name,species,avatar_url').eq('owner_id',ownerId!).order('created_at',{ascending:false}).limit(4);
  if(result.error)throw result.error;return result.data??[];
 }});
 const consultations=useQuery({queryKey:[...key,'consultations'],enabled,queryFn:async()=>{
  const result=await supabase.from('consultations').select('id,status,chief_complaint,created_at').eq('pet_owner_id',ownerId!).order('created_at',{ascending:false}).limit(5);
  if(result.error)throw result.error;return result.data??[];
 }});
 const subscription=useQuery({queryKey:[...key,'membership'],enabled,queryFn:async()=>{
  const result=await supabase.from('subscriptions').select('status,expires_at').eq('user_id',user!.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(result.error)throw result.error;return result.data;
 }});
 const orders=useQuery({queryKey:[...key,'orders'],enabled,queryFn:async()=>{
  const result=await supabase.from('orders').select('id,total_amount,status,payment_status,created_at').eq('customer_id',ownerId!).order('created_at',{ascending:false}).limit(3);
  if(result.error)throw result.error;return result.data??[];
 }});
 return {pets,consultations,subscription,orders};
}
