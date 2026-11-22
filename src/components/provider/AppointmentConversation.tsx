import {useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/auth-context';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {MessageItem,MessageTranscript} from '@/components/chat/MessageTranscript';
import {appointmentConversationService as service,conversationError,conversationReadError} from '@/lib/services/appointment-conversation-service';
function Conversation({bookingId,userId}:{bookingId:string;userId:string}){
 const cache=useQueryClient();const[cursors,setCursors]=useState<number[]>([]);const before=cursors.at(-1);const[draft,setDraft]=useState('');const[busy,setBusy]=useState(false);const[acknowledging,setAcknowledging]=useState(false);const[error,setError]=useState('');const[feedback,setFeedback]=useState('');const retry=useRef({body:'',nonce:''});
 const sendLock=useRef(false);
 const readLock=useRef(false);
 const refreshLock=useRef(false);const[refreshing,setRefreshing]=useState(false);
 const state=useQuery({queryKey:['appointment-thread',userId,bookingId,'state'],queryFn:()=>service.state(bookingId),refetchInterval:10_000});
 const messages=useQuery({queryKey:['appointment-thread',userId,bookingId,'messages',before],enabled:!!state.data&&!state.isError,queryFn:()=>service.messages(bookingId,before),refetchInterval:before===undefined?10_000:false});
 async function refresh(){await Promise.all([cache.invalidateQueries({queryKey:['appointment-thread',userId,bookingId]},{throwOnError:true}),cache.invalidateQueries({queryKey:['notifications',userId]},{throwOnError:true})]);}
 const lastVisible=messages.data?.rows.at(-1)?.ordinal ?? 0;
 return <section id="messages" className="care-path mt-6 space-y-5" aria-labelledby="appointment-messages-title">
  <h2 id="appointment-messages-title" className="text-xl">Appointment conversation</h2>
  <p className="text-sm text-muted-foreground">Use this thread for scheduling and visit coordination with the authorized provider team. For veterinary care, <Link className="text-primary underline" to="/consultations/new">start a consultation</Link>. Messages are retained with the appointment history; they cannot be edited or deleted here.</p>
  {state.isPending?<p role="status">Checking conversation access…</p>:state.isError?<><p role="alert">Could not load this conversation, or your access was removed.</p><Button variant="outline" onClick={()=>void state.refetch()}>Retry conversation</Button></>:state.data&&<>
   <div className="flex flex-wrap gap-3 items-center"><span className="text-sm">{state.data.unread_count} unread to you</span><Button type="button" variant="outline" disabled={refreshing} onClick={async()=>{if(refreshLock.current)return;refreshLock.current=true;setRefreshing(true);setError('');setFeedback('');try{await refresh();setFeedback('Conversation refreshed.');}catch{setError('Could not refresh the conversation or unread count. Your draft is retained. Please try again.');}finally{refreshLock.current=false;setRefreshing(false);}}}>{refreshing?'Refreshing messages…':'Refresh messages'}</Button><Button type="button" variant="outline" disabled={acknowledging||!lastVisible||messages.isError} onClick={async()=>{if(readLock.current)return;readLock.current=true;setAcknowledging(true);setError('');setFeedback('');try{await service.markRead(bookingId,lastVisible);setFeedback('Read status saved through the messages on this page.');try{await refresh();}catch{setFeedback('Read status saved. Refresh messages to update the unread count.');}}catch(cause){setError(conversationReadError(cause));}finally{readLock.current=false;setAcknowledging(false);}}}>Mark messages through this page as read</Button></div>
   {before!==undefined&&<p className="text-sm">You are viewing older messages. <Button variant="link" onClick={()=>setCursors(previous=>previous.slice(0,-1))}>View newer messages</Button><Button variant="link" onClick={()=>setCursors([])}>View latest messages</Button></p>}
   {messages.isPending?<p role="status">Loading messages…</p>:messages.isError?<><p role="alert">Could not load messages. Your draft is retained.</p><Button variant="outline" onClick={()=>void messages.refetch()}>Retry messages</Button></>:<>
    {!!messages.data?.hasOlder&&<Button variant="outline" onClick={()=>{const cursor=messages.data?.rows[0]?.ordinal;if(cursor!==undefined)setCursors(previous=>previous.at(-1)===cursor?previous:[...previous,cursor]);}}>Load older messages</Button>}
    <MessageTranscript key={before ?? 'latest'} label="Appointment messages" empty="No messages on this page."
      lastId={messages.data?.rows.at(-1)?.id} followLatest={before===undefined} className="max-h-[min(48dvh,30rem)]">
      {messages.data?.rows.map(message=><MessageItem key={message.id}
        sender={`${message.sender_name} · ${message.sender_id===userId?'You':message.sender_role==='customer'?'Customer':'Provider team'}`}
        own={message.sender_id===userId} sentAt={message.created_at} body={message.body}/>)}
    </MessageTranscript>
   </>}
   {state.data.can_send?<form className="space-y-3 rounded-xl border bg-card p-3 sm:p-4" onSubmit={async event=>{
    event.preventDefault();const body=draft.trim();if(sendLock.current||busy||state.isError||!state.data?.can_send||messages.isError||!body||body.length>2000)return;sendLock.current=true;setBusy(true);setError('');setFeedback('');if(retry.current.body!==body)retry.current={body,nonce:crypto.randomUUID()};
    try{await service.send(bookingId,body,retry.current.nonce);setDraft('');retry.current={body:'',nonce:''};setFeedback('Message saved to the conversation.');setCursors([]);try{await refresh();}catch{setFeedback('Message saved to the conversation. Refresh messages to load the latest view; do not send it again.');}}
    catch(cause){setError(conversationError(cause));void state.refetch();}
    finally{sendLock.current=false;setBusy(false);}
   }}><Label htmlFor={`appointment-message-${bookingId}`}>Message to the appointment participants</Label><Textarea id={`appointment-message-${bookingId}`} required maxLength={2000} value={draft} disabled={busy} onChange={event=>setDraft(event.target.value)}/><p className="text-xs text-muted-foreground">Text only, up to 2,000 characters. Messages appear in-app; no email or SMS is sent.</p><Button type="submit" disabled={busy||!draft.trim()||messages.isError}>{busy?'Sending…':'Send message'}</Button></form>:<div><p className="text-sm text-muted-foreground">This conversation is read-only. Previous messages remain available to authorized participants.</p></div>}
  </>}
  {(state.isError || (state.data && !state.data.can_send)) && draft && <div className="space-y-2 rounded-xl border bg-muted/20 p-4"><Label htmlFor={`retained-draft-${bookingId}`}>Your retained draft</Label><Textarea id={`retained-draft-${bookingId}`} readOnly value={draft}/><p className="text-xs text-muted-foreground">Your draft is retained on this page. You can copy it before leaving. Previous messages stay hidden if access cannot be verified.</p></div>}
  {error&&<p role="alert" className="text-destructive">{error}</p>}{feedback&&<p role="status">{feedback}</p>}
 </section>;
}
export function AppointmentConversation({bookingId}:{bookingId:string}){const{user}=useAuth();return user?<Conversation key={`${user.id}:${bookingId}`} bookingId={bookingId} userId={user.id}/>:null;}
