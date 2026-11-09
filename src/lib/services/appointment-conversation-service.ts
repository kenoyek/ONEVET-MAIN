import {supabase} from '@/integrations/supabase/client';
import type {Database} from '@/integrations/supabase/types';
export type AppointmentMessage=Pick<Database['public']['Tables']['provider_booking_messages']['Row'],'id'|'ordinal'|'sender_id'|'sender_name'|'sender_role'|'body'|'created_at'>;
export function conversationError(error:unknown){
 if(typeof error==='object'&&error&&'code'in error){
  if(error.code==='42501')return 'This conversation is unavailable or read-only for this account. Refresh to check your current access.';
  if(error.code==='22023')return 'Write a message of 1–2000 characters and use the current conversation.';
  if(error.code==='23514')return 'The message rate limit was reached. Please wait before trying again.';
 }
 return 'Could not confirm the update. Your draft is retained; retrying the same message will not create a duplicate.';
}
export const appointmentConversationService={
 async state(bookingId:string){const{data,error}=await supabase.rpc('get_booking_thread_state',{booking_uuid:bookingId});if(error)throw error;if(!data?.[0])throw new Error('Conversation state unavailable');return data[0];},
 async messages(bookingId:string,before?:number){
  let query=supabase.from('provider_booking_messages').select('id,ordinal,sender_id,sender_name,sender_role,body,created_at').eq('booking_id',bookingId).order('ordinal',{ascending:false});
  if(before!==undefined)query=query.lt('ordinal',before);
  const{data,error}=await query.range(0,30);if(error)throw error;return{rows:data.slice(0,30).reverse(),hasOlder:data.length>30};
 },
 async send(bookingId:string,body:string,nonce:string){
  const text=body.trim();if(!text||text.length>2000)throw{code:'22023'};
  const{data,error}=await supabase.rpc('send_booking_message',{booking_uuid:bookingId,message_text:text,client_nonce:nonce});if(error)throw error;if(!data)throw new Error('Message result unavailable');return data;
 },
 async markRead(bookingId:string,ordinal:number){const{error}=await supabase.rpc('mark_booking_thread_read',{booking_uuid:bookingId,through_ordinal:ordinal});if(error)throw error;},
};
