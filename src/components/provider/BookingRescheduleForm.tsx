import { bookingDateRange, initialBookingDate } from '@/lib/booking-date-range';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { appointmentService as service, appointmentError, bookingTime, watDate, type Appointment } from '@/lib/services/appointment-service';
export function BookingRescheduleForm({ booking, onSubmitted }: { booking: Appointment; onSubmitted: () => Promise<void> }) {
  const { user } = useAuth(); const navigate = useNavigate();
  const range=bookingDateRange();
  const [date, setDate] = useState(()=>initialBookingDate(watDate(new Date(booking.start_at)),range.today,range.last));
  const validDate=!!date && initialBookingDate(date,range.today,range.last)===date;
  const [start, setStart] = useState(''); const [reason, setReason] = useState(''); const [acceptedVersion, setAcceptedVersion] = useState<number|null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const retry = useRef({ payload: '', key: '' });
  const actionLock=useRef(false),active=useRef(true);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  const current = useQuery({ queryKey: ['reschedule-service',user?.id,booking.service_id], queryFn: () => service.service(booking.service_id) });
  const slots = useQuery({ queryKey: ['reschedule-slots',user?.id,booking.id,date,current.data?.service_version], enabled: validDate && !current.isError && !!current.data?.booking_enabled, queryFn: () => service.rescheduleSlots(booking.id,date), refetchInterval:60_000 });
  const item = current.data;
  const consent = acceptedVersion!==null && acceptedVersion===item?.service_version;
  const alternatives=slots.data?.filter(slot=>Date.parse(slot.start_at)!==Date.parse(booking.start_at))??[];
  const currentSlot=validDate&&!slots.isFetching&&!slots.isError&&alternatives.some(slot=>slot.start_at===start);
  const reasonReady=reason.trim().length>=5&&reason.trim().length<=1000;
  const ready=!!item?.booking_enabled&&!current.isFetching&&!current.isError&&currentSlot&&reasonReady&&consent;
  const remaining=[...(!validDate?['Choose a valid date within the next 90 days.']:[]),...(!currentSlot?[slots.isFetching?'Wait for alternative times to finish checking.':'Choose a currently available alternative time.']:[]),...(!reasonReady?['Add a reason of 5–1,000 characters.']:[]),...(!consent?['Accept the current service terms.']:[]),...(current.isFetching?['Wait for current service terms to finish checking.']:[])];
  return <form aria-busy={busy} className="rounded-lg bg-muted/40 p-4 space-y-4" onSubmit={async event=>{
    event.preventDefault(); if(actionLock.current || busy || !ready || !item)return; actionLock.current=true;setBusy(true);setError('');
    const input={bookingId:booking.id,bookingVersion:booking.version,serviceVersion:item.service_version!,start,reason:reason.trim()};const payload=JSON.stringify(input);
    if(retry.current.payload!==payload)retry.current={payload,key:crypto.randomUUID()};
    try{const id=await service.reschedule({...input,key:retry.current.key});if(typeof id!=='string'||!id)throw new Error('Reschedule result unavailable');if(!active.current)return;try{await onSubmitted();}catch{/* The acknowledged replacement still exists if refreshing its parent view fails. */}if(active.current)navigate(`/appointments/${id}`);}
    catch(cause){if(!active.current)return;setError(appointmentError(cause));if(typeof cause==='object'&&cause&&'code'in cause&&cause.code==='23P01')setStart('');void slots.refetch();if(typeof cause==='object' && cause && 'code' in cause && cause.code==='40001'){void current.refetch();setAcceptedVersion(null);setStart('');}}
    finally{actionLock.current=false;if(active.current)setBusy(false);}
  }}>
    <h4 className="font-medium">Request a different time</h4>
    <p className="text-sm">Your original appointment stays confirmed until the provider accepts the new request. If declined or cancelled, the original stays in place. Only one alternative can be pending at a time.</p>
    {current.isPending?<p role="status">Loading current service terms…</p>:current.isError || !item?<><p role="alert">Current service terms are unavailable.</p><Button type="button" variant="outline" onClick={()=>void current.refetch()}>Refresh service terms</Button></>:!item.booking_enabled?<p>The provider is not accepting new requests. Contact the team for help.</p>:<>
      <p className="text-sm">Original fee: {booking.currency} {Number(booking.base_fee).toLocaleString('en-NG',{minimumFractionDigits:2})}. New request: {item.currency} {Number(item.base_price).toLocaleString('en-NG',{minimumFractionDigits:2})} · {item.duration_minutes} minutes. No online payment is collected.</p>
      <fieldset disabled={busy} className="space-y-4"><legend className="sr-only">Reschedule details</legend>
        <div><Label htmlFor={`reschedule-date-${booking.id}`}>New date · WAT</Label><Input id={`reschedule-date-${booking.id}`} type="date" required min={range.today} max={range.last} value={date} onChange={event=>{setDate(event.target.value);setStart('');setAcceptedVersion(null);}}/></div>
        <div><Label htmlFor={`reschedule-time-${booking.id}`}>New start time · WAT</Label>{!validDate?<p role="status">Choose a valid date within the next 90 days.</p>:slots.isPending?<p role="status">Loading alternative times…</p>:slots.isError?<><p role="alert">Could not load alternative times.</p><Button type="button" variant="outline" onClick={()=>void slots.refetch()}>Retry alternative times</Button></>:<><select id={`reschedule-time-${booking.id}`} className="w-full rounded border bg-background p-3" required value={start} onChange={event=>{setStart(event.target.value);setAcceptedVersion(null);}}><option value="">Choose a different time</option>{alternatives.map(slot=><option key={slot.start_at} value={slot.start_at}>{bookingTime(slot.start_at)}</option>)}</select>{!alternatives.length&&<p>No alternative times on this date. Choose another date.</p>}</>}</div>
        <div><Label htmlFor={`reschedule-reason-${booking.id}`}>Reason shared with the provider</Label><Textarea id={`reschedule-reason-${booking.id}`} required minLength={5} maxLength={1000} value={reason} onChange={event=>setReason(event.target.value)}/></div>
        <label className="flex gap-3 items-start"><input type="checkbox" className="mt-1" required checked={consent} onChange={event=>setAcceptedVersion(event.target.checked?item.service_version:null)}/>I accept the current service duration and base fee for this alternative. My animal, contact and visit details will be copied to the new request. The original remains confirmed until the alternative is accepted.</label>
      </fieldset>
      {start&&!slots.isFetching&&!currentSlot&&validDate&&!slots.isError&&<p role="status" className="text-sm">Your selected alternative is no longer available. Choose another time.</p>}
      <div id={`reschedule-readiness-${booking.id}`} role="status" className="rounded-xl border bg-background/60 p-4 text-sm">{remaining.length?<><p className="font-medium mb-2">Before you request a different time</p><ul className="list-disc pl-5 space-y-1">{remaining.map(message=><li key={message}>{message}</li>)}</ul></>:<p>Ready to request. Your original appointment remains confirmed until the provider accepts the alternative.</p>}</div>
      <Button type="submit" aria-describedby={`reschedule-readiness-${booking.id}`} disabled={busy || !ready}>{busy?'Submitting…':'Submit reschedule request'}</Button>
    </>}
    {error&&<p role="alert" className="text-destructive">{error}</p>}
  </form>;
}
