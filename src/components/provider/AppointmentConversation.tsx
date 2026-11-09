import {useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/auth-context';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {bookingTime} from '@/lib/services/appointment-service';
import {appointmentConversationService as service,conversationError} from '@/lib/services/appointment-conversation-service';
function Conversation({bookingId,userId}:{bookingId:string;userId:string}){
 const cache=useQueryClient();const[before,setBefore]=useState<number|undefined>();const[draft,setDraft]=useState('');const[busy,setBusy]=useState(false);const[acknowledging,setAcknowledging]=useState(false);const[error,setError]=useState('');const[feedback,setFeedback]=useState('');const retry=useRef({body:'',nonce:''});
 const state=useQuery({queryKey:['appointment-thread',userId,bookingId,'state'],queryFn:()=>service.state(bookingId),refetchInterval:10_000});
 const messages=useQuery({queryKey:['appointment-thread',userId,bookingId,'messages',before],enabled:!!state.data&&!state.isError,queryFn:()=>service.messages(bookingId,before),refetchInterval:before===undefined?10_000:false});
 async function refresh(){await Promise.all([cache.invalidateQueries({queryKey:['appointment-thread',userId,bookingId]}),cache.invalidateQueries({queryKey:['notifications',userId]})]);}
 const lastVisible=messages.data?.rows.at(-1)?.ordinal ?? 0;
 return <section id="messages" className="care-path mt-6 space-y-5" aria-labelledby="appointment-messages-title">
  <h2 id="appointment-messages-title" className="text-xl">Appointment conversation</h2>
  <p className="text-sm text-muted-foreground">Use this thread for scheduling and visit coordination with the authorized provider team. For veterinary care, <Link className="text-primary underline" to="/consultations/new">start a consultation</Link>. Messages are retained with the appointment history; they cannot be edited or deleted here.</p>
  {state.isPending?<p role="status">Checking conversation access…</p>:state.isError?<><p role="alert">Could not load this conversation, or your access was removed.</p><Button variant="outline" onClick={()=>void state.refetch()}>Retry conversation</Button></>:state.data&&<>
   <div className="flex flex-wrap gap-3 items-center"><span className="text-sm">{state.data.unread_count} unread to you</span><Button type="button" variant="outline" onClick={()=>void refresh()}>Refresh messages</Button><Button type="button" variant="outline" disabled={acknowledging||!lastVisible||messages.isError} onClick={async()=>{setAcknowledging(true);setError('');try{await service.markRead(bookingId,lastVisible);await refresh();}catch(cause){setError(conversationError(cause));}finally{setAcknowledging(false);}}}>Mark messages through this page as read</Button></div>
   {before!==undefined&&<p className="text-sm">You are viewing older messages. <Button variant="link" onClick={()=>setBefore(undefined)}>View latest messages</Button></p>}
   {messages.isPending?<p role="status">Loading messages…</p>:messages.isError?<><p role="alert">Could not load messages. Your draft is retained.</p><Button variant="outline" onClick={()=>void messages.refetch()}>Retry messages</Button></>:<>
    {!!messages.data?.hasOlder&&<Button variant="outline" onClick={()=>setBefore(messages.data?.rows[0]?.ordinal)}>Load older messages</Button>}
    {!messages.data?.rows.length?<p>No messages on this page.</p>:<ol className="space-y-4" aria-label="Appointment messages">{messages.data.rows.map(message=><li key={message.id} className={`rounded-lg border p-4 ${message.sender_id===userId?'bg-primary/5':''}`}><div className="flex flex-wrap gap-2 justify-between text-sm"><p className="font-medium">{message.sender_name} · {message.sender_id===userId?'You':message.sender_role==='customer'?'Customer':'Provider team'}</p><time>{bookingTime(message.created_at)}</time></div><p className="whitespace-pre-wrap break-words mt-3">{message.body}</p></li>)}</ol>}
   </>}
   {state.data.can_send?<form className="space-y-3" onSubmit={async event=>{
    event.preventDefault();const body=draft.trim();if(busy||!body||body.length>2000)return;setBusy(true);setError('');setFeedback('');if(retry.current.body!==body)retry.current={body,nonce:crypto.randomUUID()};
    try{await service.send(bookingId,body,retry.current.nonce);setDraft('');retry.current={body:'',nonce:''};setFeedback('Message saved to the conversation.');setBefore(undefined);await refresh();}
    catch(cause){setError(conversationError(cause));void state.refetch();}
    finally{setBusy(false);}
   }}><Label htmlFor={`appointment-message-${bookingId}`}>Message to the appointment participants</Label><Textarea id={`appointment-message-${bookingId}`} required maxLength={2000} value={draft} disabled={busy} onChange={event=>setDraft(event.target.value)}/><p className="text-xs text-muted-foreground">Text only, up to 2,000 characters. Messages appear in-app; no email or SMS is sent.</p><Button type="submit" disabled={busy||!draft.trim()||messages.isError}>{busy?'Sending…':'Send message'}</Button></form>:<div><p className="text-sm text-muted-foreground">This conversation is read-only. Previous messages remain available to authorized participants.</p>{draft&&<><Label htmlFor={`retained-draft-${bookingId}`}>Your retained draft</Label><Textarea id={`retained-draft-${bookingId}`} readOnly value={draft}/><p className="text-xs">You can copy this draft before leaving.</p></>}</div>}
  </>}
  {error&&<p role="alert" className="text-destructive">{error}</p>}{feedback&&<p role="status">{feedback}</p>}
 </section>;
}
export function AppointmentConversation({bookingId}:{bookingId:string}){const{user}=useAuth();return user?<Conversation key={`${user.id}:${bookingId}`} bookingId={bookingId} userId={user.id}/>:null;}
