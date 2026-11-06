import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { appointmentService as service, appointmentError, bookingTime, snapshotText, type Appointment, type BookingDecision } from '@/lib/services/appointment-service';
function RequestCard({ booking, provider, refresh }: { booking: Appointment; provider: boolean; refresh: () => Promise<void> }) {
  const { user } = useAuth();
  const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [showHistory, setShowHistory] = useState(false);
  const events = useQuery({ queryKey: ['booking-history', user?.id, booking.id, booking.version], queryFn: () => service.history(booking.id), enabled: showHistory });
  async function respond(decision: BookingDecision) {
    if (busy) return; setBusy(true); setError('');
    try { await service.respond(booking, decision, note); setNote(''); await refresh(); }
    catch (cause) { setError(appointmentError(cause)); }
    finally { setBusy(false); }
  }
  const open = ['pending','confirmed'].includes(booking.status);
  return <article className="rounded-lg border p-5 space-y-3">
    {open && booking.provider_eligibility==='unavailable' && <p role="alert" className="text-destructive">Provider approval is currently unavailable. This recorded request has not been cancelled automatically. Contact support before attending.</p>}
    {open && booking.provider_eligibility==='unknown' && <p role="status">Could not recheck provider approval. Refresh or contact support before attending.</p>}
    <h3 className="text-lg font-medium">{snapshotText(booking.service_snapshot,'name')}</h3>
    <p>{snapshotText(booking.service_snapshot,'organization_name')} · {booking.status}</p>
    <p>{bookingTime(booking.start_at)} – {new Date(booking.end_at).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' })} WAT</p>
    <p className="text-sm">{snapshotText(booking.animal_snapshot,'name')} · {snapshotText(booking.animal_snapshot,'species')} · {snapshotText(booking.service_snapshot,'delivery_mode')==='home_visit' ? 'Home visit' : 'At provider location'}</p>
    <p>Recorded base fee: {booking.currency} {Number(booking.base_fee).toLocaleString('en-NG', { minimumFractionDigits: 2 })}. No online payment collected.</p>
    <p className="text-sm">Contact phone: {booking.contact_phone}</p>
    {booking.visit_address && <p className="text-sm whitespace-pre-wrap">Visit address: {booking.visit_address}</p>}
    {booking.provider_address && <p className="text-sm whitespace-pre-wrap">Provider location: {booking.provider_address}</p>}
    {booking.customer_notes && <p className="text-sm whitespace-pre-wrap">Customer notes: {booking.customer_notes}</p>}
    {booking.response_note && <p className="text-sm whitespace-pre-wrap">Latest response: {booking.response_note}</p>}
    {booking.status==='pending' && <p className="text-sm text-muted-foreground">Awaiting provider confirmation. This request does not reserve the slot. Confirmation requires at least 30 minutes' notice.</p>}
    {open && <><Label htmlFor={`response-${booking.id}`}>Response / explanation (required for cancellation or decline)</Label><Textarea id={`response-${booking.id}`} disabled={busy} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} />
      {provider && booking.status==='pending' && <p className="text-sm text-muted-foreground">Confirm only if you can provide this service at the recorded fee. Confirming a provider-location visit shares your primary location address with this customer.</p>}
      <div className="flex flex-wrap gap-3">
        {provider && booking.status==='pending' && <><Button disabled={busy} onClick={() => void respond('confirmed')}>Confirm request</Button><Button variant="outline" disabled={busy || note.trim().length<5} onClick={() => void respond('declined')}>Decline request</Button></>}
        <Button variant="outline" disabled={busy || note.trim().length<5} onClick={() => void respond('cancelled')}>Cancel request</Button>
        {provider && booking.status==='confirmed' && new Date(booking.end_at)<=new Date() && <Button disabled={busy} onClick={() => void respond('completed')}>Mark completed</Button>}
      </div></>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Button variant="link" onClick={() => setShowHistory(previous => !previous)}>{showHistory ? 'Hide history' : 'Show history'}</Button>
    {showHistory && (events.isPending ? <p role="status">Loading history…</p> : events.isError ? <><p role="alert">Could not load history.</p><Button variant="outline" onClick={() => void events.refetch()}>Retry history</Button></> : <ol className="space-y-2">{events.data?.map(event => <li key={event.id} className="border-l-2 pl-3 text-sm">{event.status} · {bookingTime(event.created_at)}{event.note && <p className="whitespace-pre-wrap">{event.note}</p>}</li>)}</ol>)}
  </article>;
}
export function BookingRequestList({ providerId }: { providerId?: string }) {
  const { user } = useAuth(); const cache = useQueryClient(); const [page,setPage] = useState(0);
  const requests = useQuery({ queryKey: ['booking-requests',user?.id,providerId ?? 'customer',page], enabled: !!user, refetchInterval: 60_000, queryFn: () => service.list(providerId ? { providerId } : { customerId: user!.id },page) });
  async function refresh() { await Promise.all([cache.invalidateQueries({ queryKey: ['booking-requests',user?.id] }),cache.invalidateQueries({ queryKey: ['appointment-slots'] })]); }
  return <section className="space-y-5"><h2 className="text-xl">{providerId ? 'Customer booking requests' : 'Your booking requests'}</h2>
    {requests.isPending ? <p role="status">Loading requests…</p> : requests.isError ? <p role="alert">Could not load booking requests.</p> : requests.data?.rows.length ? requests.data.rows.map(booking => <RequestCard key={booking.id} booking={booking} provider={!!providerId} refresh={refresh} />) : <p>No requests on this page.</p>}
    <div className="flex flex-wrap gap-3 items-center"><Button variant="outline" onClick={() => void refresh()}>Refresh requests</Button><Button variant="outline" disabled={page===0 || requests.isFetching} onClick={() => setPage(previous=>previous-1)}>Previous</Button><span>Page {page+1}</span><Button variant="outline" disabled={!requests.data?.hasNext || requests.isFetching} onClick={() => setPage(previous=>previous+1)}>Next</Button></div>
  </section>;
}
