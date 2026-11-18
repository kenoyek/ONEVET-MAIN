import { bookingPreparation } from '@/lib/booking-preparation';
import { serviceDelivery } from '@/lib/service-display';
import { bookingListFilters, bookingReturnPath, bookingViewHelp } from '@/lib/booking-list-navigation';
import { bookingStatus } from '@/lib/booking-status';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { AppointmentCalendarDownload } from './AppointmentCalendarDownload';
import { BookingRescheduleForm } from './BookingRescheduleForm';
import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { appointmentService as service, appointmentError, bookingTime, snapshotText, type Appointment, type BookingDecision, type BookingView } from '@/lib/services/appointment-service';
export function BookingRequestCard({ booking, provider, refresh, readOnly = false }: { booking: Appointment; provider: boolean; refresh: () => Promise<void>; readOnly?: boolean }) {
  const { user } = useAuth();
  const location=useLocation();
  const returnTo=bookingReturnPath(location.state?.bookingReturnTo || location.pathname+location.search);
  const actionLock=useRef(false);
  const reviewLock=useRef(false);
  const [needsReview,setNeedsReview]=useState(false);
  const [reviewRefreshing,setReviewRefreshing]=useState(false);
  const [responseFeedback,setResponseFeedback]=useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [showHistory, setShowHistory] = useState(false);
  const events = useQuery({ queryKey: ['booking-history', user?.id, booking.id, booking.version], queryFn: () => service.history(booking.id), enabled: showHistory });
  async function refreshForReview(){
    if(actionLock.current)return;
    actionLock.current=true;setReviewRefreshing(true);
    try{await refresh();reviewLock.current=false;setNeedsReview(false);setError('');setResponseFeedback('Details refreshed. Review the recorded status and your explanation before responding.');}
    catch{setError('Could not refresh this request. Your explanation is retained. Try refreshing again.');}
    finally{actionLock.current=false;setReviewRefreshing(false);}
  }
  async function respond(decision: BookingDecision) {
    if (actionLock.current || reviewLock.current) return; actionLock.current=true; setBusy(true); setError('');setResponseFeedback('');
    try {
      await service.respond(booking, decision, note); setNote('');setResponseFeedback('Your response was saved.');
      try{await refresh();}catch{reviewLock.current=true;setNeedsReview(true);setResponseFeedback('Your response was saved. Refresh request details to see the latest status; do not send the same response again.');}
    }
    catch (cause) {
      setError(appointmentError(cause));
      if(typeof cause==='object'&&cause&&'code' in cause&&['40001','23P01','42501'].includes(String(cause.code))){reviewLock.current=true;setNeedsReview(true);}
    }
    finally { actionLock.current=false; setBusy(false); }
  }
  const decisionBlocked=busy || needsReview || reviewRefreshing;
  const statusInfo=bookingStatus(booking.status,booking.start_at,booking.end_at);
  const preparation=bookingPreparation({status:booking.status,start:booking.start_at,end:booking.end_at,delivery:snapshotText(booking.service_snapshot,'delivery_mode'),eligibility:booking.provider_eligibility});
  const actingProvider=provider && booking.provider_access===true && booking.customer_id!==user?.id;
  const canAct=!readOnly && (actingProvider || booking.customer_id===user?.id);
  const open = ['pending','confirmed'].includes(booking.status);
  const withinConfirmationWindow = new Date(booking.start_at).getTime() >= Date.now()+30*60_000;
  return <article id={`booking-${booking.id}`} className="min-w-0 break-words rounded-lg border p-5 space-y-3">
    {open && booking.provider_eligibility==='unavailable' && <p role="alert" className="text-destructive">Provider approval is currently unavailable. This recorded request has not been cancelled automatically. Contact support before attending.</p>}
    {open && booking.provider_eligibility==='unknown' && <p role="status">Could not recheck provider approval. Refresh or contact support before attending.</p>}
    <h3 className="text-lg font-medium">{snapshotText(booking.service_snapshot,'name')}</h3>
    <p>{snapshotText(booking.service_snapshot,'organization_name')}</p>
    <section className="rounded-xl border bg-muted/30 p-4"><h4 className="font-semibold">{statusInfo.label}</h4><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{statusInfo.text}</p></section>
    <Link className="text-primary underline text-sm" state={{bookingReturnTo:returnTo}} to={`/appointments/${booking.id}`}>Open request details</Link>
    {canAct && <Link className="text-primary underline text-sm block" state={{bookingReturnTo:returnTo}} to={`/appointments/${booking.id}#appointment-messages`}>View appointment messages</Link>}
    {!provider && ['cancelled','declined','completed'].includes(booking.status) && <Link className="text-primary underline text-sm block" to="/provider-marketplace">Browse care for a new request</Link>}
    {booking.replacement_for && <p className="text-sm">Reschedule of <Link className="text-primary underline" state={{bookingReturnTo:returnTo}} to={`/appointments/${booking.replacement_for}`}>the original appointment</Link>. {booking.status==='pending'?'The original remains confirmed until this alternative is accepted.':''}</p>}
    {booking.reschedule_reason && <p className="text-sm whitespace-pre-wrap">Reschedule reason: {booking.reschedule_reason}</p>}
    <p>{bookingTime(booking.start_at)} – {new Date(booking.end_at).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' })} WAT</p>
    <p className="text-sm">{snapshotText(booking.animal_snapshot,'name')} · {snapshotText(booking.animal_snapshot,'species')} · {serviceDelivery(snapshotText(booking.service_snapshot,'delivery_mode'))}</p>
    <p>Recorded base fee: {booking.currency} {Number(booking.base_fee).toLocaleString('en-NG', { minimumFractionDigits: 2 })}. No online payment collected.</p>
    <p className="text-sm">Contact phone: {booking.contact_phone}</p>
    {booking.visit_address && <p className="text-sm whitespace-pre-wrap">Visit address: {booking.visit_address}</p>}
    {booking.provider_address && <p className="text-sm whitespace-pre-wrap">Provider location: {booking.provider_address}</p>}
    {booking.customer_notes && <p className="text-sm whitespace-pre-wrap">Customer notes: {booking.customer_notes}</p>}
    {booking.response_note && <p className="text-sm whitespace-pre-wrap">Latest response: {booking.response_note}</p>}
    {booking.customer_id===user?.id && preparation && <section aria-label="Appointment next steps" className="rounded-xl border bg-muted/20 p-4 sm:p-5">
      <h4 className="font-semibold">{preparation.title}</h4>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">{preparation.steps.map(step=><li key={step}>{step}</li>)}</ul>
      {booking.provider_eligibility!=='eligible' && <Link className="mt-3 inline-block text-sm text-primary underline" to="/contact">Contact support</Link>}
    </section>}
    {open && canAct && <><Label htmlFor={`response-${booking.id}`}>Response / explanation (required for cancellation or decline)</Label><Textarea id={`response-${booking.id}`} disabled={busy} maxLength={2000} value={note} onChange={event => {setNote(event.target.value);setResponseFeedback('');}} />
      {actingProvider && booking.status==='pending' && <p className="text-sm text-muted-foreground">Confirm only if you can provide this service at the recorded fee. Confirming a provider-location visit shares your primary location address with this customer.</p>}
      <div className="flex flex-wrap gap-3">
        {actingProvider && booking.status==='pending' && <><Button disabled={decisionBlocked || !withinConfirmationWindow || booking.provider_eligibility==='unavailable' || booking.provider_eligibility==='unknown'} onClick={() => void respond('confirmed')}>Confirm request</Button><Button variant="outline" disabled={decisionBlocked || note.trim().length<5} onClick={() => void respond('declined')}>Decline request</Button></>}
        <Button variant="outline" disabled={decisionBlocked || note.trim().length<5} onClick={() => void respond('cancelled')}>Cancel request</Button>
        {actingProvider && booking.status==='confirmed' && new Date(booking.end_at)<=new Date() && <Button disabled={decisionBlocked} onClick={() => void respond('completed')}>Mark completed</Button>}
      </div></>}
    {!readOnly && !actingProvider && booking.customer_id===user?.id && booking.status==='confirmed' && new Date(booking.start_at)>new Date() && <><Button variant="outline" disabled={decisionBlocked} onClick={()=>setRescheduling(previous=>!previous)}>{rescheduling?'Close reschedule form':'Request reschedule'}</Button>{rescheduling && !needsReview && <BookingRescheduleForm key={`${booking.id}-${booking.version}`} booking={booking} onSubmitted={refresh}/>}</>}
    {!readOnly && booking.status==='confirmed' && new Date(booking.end_at)>new Date() && (booking.customer_id===user?.id||booking.provider_owner_id===user?.id) && <AppointmentCalendarDownload key={`${user?.id}-${booking.id}`} bookingId={booking.id}/>}
    {needsReview&&<section className="rounded-xl border bg-muted/20 p-4 space-y-3" aria-label="Review changed request"><p className="text-sm text-muted-foreground">Refresh the latest request and review its recorded status before another response.{note.trim() ? ' Your entered explanation is retained.' : ''}</p><Button variant="outline" disabled={reviewRefreshing} onClick={()=>void refreshForReview()}>{reviewRefreshing?'Refreshing request details…':'Refresh request details'}</Button></section>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {responseFeedback&&<p role="status" className="text-sm text-muted-foreground">{responseFeedback}</p>}
    <Button variant="link" onClick={() => setShowHistory(previous => !previous)}>{showHistory ? 'Hide history' : 'Show history'}</Button>
    {showHistory && (events.isPending ? <p role="status">Loading history…</p> : events.isError ? <><p role="alert">Could not load history.</p><Button variant="outline" onClick={() => void events.refetch()}>Retry history</Button></> : <ol className="space-y-2">{events.data?.map(event => <li key={event.id} className="border-l-2 pl-3 text-sm">{event.status} · {bookingTime(event.created_at)}{event.note && <p className="whitespace-pre-wrap">{event.note}</p>}</li>)}</ol>)}
  </article>;
}
export function BookingRequestList({ providerId }: { providerId?: string }) {
  const { user } = useAuth(); const cache = useQueryClient();
  const [params,setParams]=useSearchParams();
  const {view,page}=bookingListFilters(params,!!providerId);
  function changeView(next:BookingView){setParams(previous=>{const nextParams=new URLSearchParams(previous);const prefix=providerId?'booking_':'';if(next==='upcoming')nextParams.delete(prefix+'view');else nextParams.set(prefix+'view',next);nextParams.delete(prefix+'page');return nextParams;});}
  function changePage(next:number){setParams(previous=>{const nextParams=new URLSearchParams(previous);const key=providerId?'booking_page':'page';if(next<=0)nextParams.delete(key);else nextParams.set(key,String(next));return nextParams;});}
  const requests = useQuery({ queryKey: ['booking-requests',user?.id,providerId ?? 'customer',view,page], enabled: !!user, refetchInterval: 60_000, queryFn: () => service.list(providerId ? { providerId } : { customerId: user!.id },page,view) });
  async function refresh() { await Promise.all([cache.invalidateQueries({ queryKey: ['booking-requests',user?.id] }),cache.invalidateQueries({ queryKey: ['appointment-slots'] }),cache.invalidateQueries({ queryKey: ['appointment-detail',user?.id] }),cache.invalidateQueries({ queryKey: ['reschedule-slots',user?.id] })]); }
  return <section className="space-y-5"><h2 className="text-xl">{providerId ? 'Customer booking requests' : 'Your booking requests'}</h2>
    <label className="block text-sm">View requests <select aria-label="View requests" className="mt-2 block w-full min-w-0 rounded border bg-background p-2 sm:ml-3 sm:mt-0 sm:inline-block sm:w-auto" value={view} onChange={event=>{changeView(event.target.value as BookingView);}}><option value="upcoming">Upcoming</option><option value="needs_response">Needs confirmation</option><option value="past_open">Past requests still open</option><option value="history">Cancelled, declined and completed</option><option value="all">All requests</option></select></label>
    <p className="text-sm leading-relaxed text-muted-foreground">{bookingViewHelp(view)} All appointment times use Africa/Lagos (WAT).</p>
    {requests.isPending ? <p role="status">Loading requests…</p> : requests.isError ? <div role="alert" className="rounded-xl border p-5"><p>Could not load booking requests. Refresh to try again; your chosen view has been kept.</p><Button className="mt-3" variant="outline" disabled={requests.isFetching} onClick={()=>void requests.refetch()}>Retry booking requests</Button></div> : requests.data?.rows.length ? requests.data.rows.map(booking => <BookingRequestCard key={`${user?.id}-${booking.id}`} booking={booking} provider={!!providerId} refresh={refresh} />) : page>0?<section className="rounded-2xl border border-dashed p-6"><h3 className="font-semibold">No requests on this page</h3><p className="mt-2 text-sm text-muted-foreground">Your selected view may still contain earlier records. Return to its first page to check.</p><Button className="mt-4" variant="outline" onClick={()=>changePage(0)}>Return to first page</Button></section>: <section className="rounded-2xl border border-dashed p-6"><h3 className="font-semibold">{view==='upcoming'?'No upcoming appointments':view==='needs_response'?'No requests awaiting confirmation':view==='past_open'?'No past requests still open':'No requests in this view'}</h3><p className="mt-2 text-sm text-muted-foreground">{view==='upcoming'?'Pending requests need confirmation. Check All requests or Past requests still open for older records.':'Choose another view to find other appointments.'}</p>{!providerId&&<Button asChild variant="outline" className="mt-4"><Link to="/provider-marketplace">Find care services</Link></Button>}</section>}
    <div className="flex flex-wrap gap-3 items-center"><Button variant="outline" disabled={requests.isFetching} onClick={() => void refresh()}>{requests.isFetching?'Refreshing requests…':'Refresh requests'}</Button><Button variant="outline" disabled={page===0 || requests.isFetching} onClick={() => changePage(page-1)}>Previous</Button><span>Page {page+1}</span><Button variant="outline" disabled={page>=999 || requests.isError || !requests.data?.hasNext || requests.isFetching} onClick={() => changePage(page+1)}>Next</Button></div>
  </section>;
}
