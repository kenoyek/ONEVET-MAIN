import { validContactPhone } from '@/lib/contact-phone';
import { bookingAnimalContext, withBookingAnimal } from '@/lib/booking-animal-context';
import { bookingDateRange, initialBookingDate } from '@/lib/booking-date-range';
import { PageHeading } from '@/components/layout/PageHeading';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { appointmentService as service, appointmentError, bookingTime, watDate } from '@/lib/services/appointment-service';
export default function NewBooking() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  return <BookingRequestForm key={`${user?.id || 'guest'}:${params.get('service_id') || ''}:${bookingAnimalContext(params.get('animal'))}`} />;
}
function BookingRequestForm() {
  const [params]=useSearchParams();const id=params.get('service_id') ?? '';const {user,profile}=useAuth();const navigate=useNavigate();
  const range=bookingDateRange();
  const [date,setDate]=useState(()=>initialBookingDate(params.get('date'),range.today,range.last));const [start,setStart]=useState(()=>params.get('start') || '');const [animal,setAnimal]=useState(()=>bookingAnimalContext(params.get('animal')));const [phone,setPhone]=useState('');const [address,setAddress]=useState('');const [notes,setNotes]=useState('');const [acceptedVersion,setAcceptedVersion]=useState<number|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const phoneEdited=useRef(false);
  const savedPhone=profile?.phone;
  useEffect(()=>{if(!phoneEdited.current&&profile?.user_id===user?.id&&validContactPhone(savedPhone)){setPhone(savedPhone ?? '');}},[savedPhone,profile?.user_id,user?.id]);
  const retry=useRef({payload:'',key:''});
  const actionLock=useRef(false);
  const animalCheckLock=useRef(false);
  const [checkingAnimals,setCheckingAnimals]=useState(false);
  const active=useRef(true);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  const validDate=!!date && initialBookingDate(date,range.today,range.last)===date;
  const catalog=useQuery({queryKey:['booking-service',id],enabled:!!id,queryFn:()=>service.service(id),staleTime:0});
  const consent=acceptedVersion!==null && acceptedVersion===catalog.data?.service_version;
  const choices=useQuery({queryKey:['booking-animals',user?.id,profile?.id],enabled:!!profile?.id && profile.user_id===user?.id,queryFn:()=>service.animals(profile!.id)});
  async function refreshAnimals(){
    if(animalCheckLock.current || actionLock.current)return;
    animalCheckLock.current=true;setCheckingAnimals(true);
    try{await choices.refetch();}finally{animalCheckLock.current=false;if(active.current)setCheckingAnimals(false);}
  }
  const slots=useQuery({queryKey:['appointment-slots',id,date,catalog.data?.service_version],enabled:!!id && validDate && !!catalog.data?.booking_enabled,queryFn:()=>service.slots(id,date),refetchInterval:60_000});
  const item=catalog.data;const home=item?.delivery_mode==='home_visit';
  const options=choices.data?.filter(choice=>choice.kind==='pet' || ['veterinary','diagnostics'].includes(item?.category ?? '')) ?? [];
  const selected=options.find(choice=>`${choice.kind}:${choice.id}`===animal);
  const currentSlot=validDate && !slots.isFetching && !slots.isError && !!slots.data?.some(slot=>slot.start_at===start);
  const contactReady=validContactPhone(phone);
  const addressReady=!home||(address.trim().length>=10&&address.trim().length<=500);
  const remaining=[...((checkingAnimals || choices.isFetching)?['Wait for your animal records to finish checking.']:!selected?['Choose your animal or farm group.']:[]),...(!currentSlot?[slots.isFetching?'Wait for available times to finish checking.':'Choose an available appointment time.']:[]),...(!contactReady?['Add a contact phone with 7–15 digits.']:[]),...(!addressReady?['Add a visit address of at least 10 characters.']:[]),...(!consent?['Confirm the request terms and sharing of your details.']:[])];
  const ready=!checkingAnimals && contactReady && addressReady && !choices.isFetching && !choices.isError && !catalog.isFetching && !catalog.isError && !!item?.booking_enabled && !!selected && currentSlot && consent;
  const alternatives=withBookingAnimal('/provider-marketplace',animal);
  const limit=range.last;
  const resume=new URLSearchParams(params);resume.set('date',date);if(start)resume.set('start',start);else resume.delete('start');resume.delete('animal');
  const animalReturn='/booking/new?'+resume.toString();
  const farmSetup='/farms?'+new URLSearchParams({returnTo:animalReturn});
  return <div className="min-h-screen bg-background"><Navbar/><main id="main-content" tabIndex={-1} className="container-wide max-w-3xl pt-32 pb-20"><Link className="text-primary underline" to="/my-bookings">Your booking requests</Link>
    <PageHeading size="workspace" className="my-6" title={<> Request a service appointment </>}/>
    {!id?<p>Select a service from the <Link className="underline text-primary" to="/provider-marketplace">care directory</Link>.</p>:catalog.isPending?<p role="status">Loading service…</p>:catalog.isError || !item?<><p role="alert">This service is unavailable or could not be loaded.</p><div className="mt-4 flex flex-wrap gap-3"><Button onClick={()=>void catalog.refetch()}>Refresh service</Button><Button variant="outline" asChild><Link to={alternatives}>Browse other care services</Link></Button></div></>:<>
      <section className="care-path mb-6"><h2 className="text-xl">{item.name}</h2><p>{item.organization_name} · {item.city}, {item.state}</p><p className="mt-3">Base fee: {item.currency} {Number(item.base_price).toLocaleString('en-NG',{minimumFractionDigits:2})} · {item.duration_minutes} minutes</p><p className="text-sm text-muted-foreground mt-3">No online payment is collected. The provider must confirm this request; submitting does not reserve a slot. Any additional costs must be agreed separately before care.</p><Button type="button" variant="outline" className="mt-4" disabled={busy} onClick={()=>{void catalog.refetch();void slots.refetch();setAcceptedVersion(null);setStart('');}}>Refresh service details and times</Button></section>
      {animal && !choices.isPending && !choices.isFetching && !choices.isError && !catalog.isFetching && !selected && <section role="status" className="mb-6 rounded-xl border bg-muted/30 p-5">
        <h2 className="font-semibold">Check your selected animal</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your previously selected animal or farm group is not available for this service. Choose an eligible record below, refresh your saved records, or browse another service.</p>
        <div className="mt-4 flex flex-wrap gap-3"><Button variant="outline" disabled={busy || checkingAnimals} onClick={()=>void refreshAnimals()}>Refresh animal records</Button><Button variant="ghost" asChild><Link to={alternatives}>Browse other care services</Link></Button></div>
      </section>}
      {!item.booking_enabled?<section className="rounded-xl border p-5"><p>This provider is not accepting booking requests right now.</p><Button asChild variant="outline" className="mt-4"><Link to={alternatives}>Browse other care services</Link></Button></section>:choices.isPending?<p role="status">Loading your animals…</p>:choices.isError?<><p role="alert">Could not load your animals.</p><Button onClick={()=>void refreshAnimals()}>Retry animals</Button></>:!options.length?<p>Add an owned <Link className="underline text-primary" to={`/pets/new?${new URLSearchParams({returnTo:animalReturn})}`}>animal profile</Link>{['veterinary','diagnostics'].includes(item.category ?? '')?<> or <Link className="underline text-primary" to={farmSetup}>farm group</Link></>:''} before requesting this service.</p>:<form className="care-path space-y-5" onSubmit={async event=>{
        event.preventDefault();if(animalCheckLock.current || actionLock.current || !ready || !selected)return;
        if(!contactReady || !addressReady){setError('Check your contact phone and visit address before submitting.');return;}
        actionLock.current=true;setBusy(true);setError('');
        const input={serviceId:id,serviceVersion:item.service_version!,start,animalId:selected.id,kind:selected.kind,phone,address:home?address:'',notes};const payload=JSON.stringify(input);
        if(retry.current.payload!==payload)retry.current={payload,key:crypto.randomUUID()};
        try{const bookingId=await service.request({...input,key:retry.current.key});if(active.current)navigate(`/appointments/${bookingId}`);}
        catch(cause){setError(appointmentError(cause));void slots.refetch();if(typeof cause==='object' && cause && 'code' in cause && cause.code==='23P01')setStart('');if(typeof cause==='object' && cause && 'code' in cause && cause.code==='40001'){void catalog.refetch();setAcceptedVersion(null);setStart('');}}
        finally{actionLock.current=false;setBusy(false);}
      }}>
        <fieldset disabled={busy} className="space-y-5"><legend className="sr-only">Appointment request details</legend>
          <div><Label htmlFor="booking-animal">Animal or farm group</Label><select id="booking-animal" required className="w-full border rounded-md bg-background p-3" value={animal} onChange={event=>setAnimal(event.target.value)}><option value="">Choose your animal</option>{options.map(choice=><option key={`${choice.kind}:${choice.id}`} value={`${choice.kind}:${choice.id}`}>{choice.name} · {choice.species}{choice.kind==='farm_group'?' · farm group':''}</option>)}</select><Button type="button" variant="link" className="mt-1 h-auto px-0" disabled={busy || checkingAnimals || choices.isFetching} onClick={()=>void refreshAnimals()}>{checkingAnimals || choices.isFetching ? 'Checking animal records…' : 'Refresh saved animals'}</Button></div>
          <div className="flex flex-wrap gap-4 text-sm"><Link className="text-primary underline" to={`/pets/new?${new URLSearchParams({returnTo:animalReturn})}`}>Add another animal profile</Link>{['veterinary','diagnostics'].includes(item.category ?? '')&&<Link className="text-primary underline" to={farmSetup}>Add or choose a farm group</Link>}</div>
          <div><Label htmlFor="booking-date">Date · Africa/Lagos (WAT)</Label><Input id="booking-date" type="date" required min={watDate()} max={limit} value={date} onChange={event=>{setDate(event.target.value);setStart('');}}/></div>
          <div><Label htmlFor="booking-time">Available start time · WAT</Label>{!validDate?<p className="text-sm mt-2">Choose a valid date within the next 90 days.</p>:slots.isPending?<p role="status">Loading times…</p>:slots.isError?<><p role="alert">Could not load times.</p><Button type="button" variant="outline" onClick={()=>void slots.refetch()}>Retry times</Button></>:<><select id="booking-time" required className="w-full border rounded-md bg-background p-3" value={start} onChange={event=>setStart(event.target.value)}><option value="">Choose a time</option>{slots.data?.map(slot=><option key={slot.start_at} value={slot.start_at}>{bookingTime(slot.start_at)}</option>)}</select>{start&&!slots.isFetching&&!slots.data?.some(slot=>slot.start_at===start)&&<p role="status" className="text-sm mt-2">Your selected time is no longer available. Choose another time.</p>}{!slots.data?.length&&<div className="mt-2 space-y-2"><p className="text-sm">No times are available on this date. Choose another date.</p><Link className="inline-block text-sm text-primary underline" to={alternatives}>Browse other care services</Link></div>}</>}</div>
          <div><Label htmlFor="booking-phone">Contact phone (shared privately with the provider)</Label><Input id="booking-phone" aria-describedby="booking-phone-format" aria-invalid={!!phone.trim() && !contactReady} required minLength={7} maxLength={40} type="tel" value={phone} onChange={event=>{phoneEdited.current=true;setPhone(event.target.value);}}/><p id="booking-phone-format" className="mt-2 text-xs text-muted-foreground">Use 7–15 digits without letters or extensions. A leading + and common phone separators are accepted.</p></div>
          {home&&<div><Label htmlFor="booking-address">Visit address (shared privately with the provider)</Label><Textarea id="booking-address" required minLength={10} maxLength={500} value={address} onChange={event=>setAddress(event.target.value)}/></div>}
          <div><Label htmlFor="booking-notes">Notes for the provider (optional)</Label><Textarea id="booking-notes" maxLength={2000} value={notes} onChange={event=>setNotes(event.target.value)}/></div>
          <label className="flex gap-3 items-start"><input type="checkbox" required checked={consent} onChange={event=>setAcceptedVersion(event.target.checked?item.service_version:null)} className="mt-1"/>I understand this is a pending request, the recorded base fee is {item.currency} {Number(item.base_price).toLocaleString('en-NG')}, and my selected animal details, contact phone{home?' and visit address':''} will be shared with this provider.</label>
        </fieldset>
        <section aria-labelledby="booking-review-heading" className="rounded-xl border bg-muted/30 p-5">
          <h2 id="booking-review-heading" className="font-semibold mb-4">Review your request</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Animal</dt><dd className="font-medium">{selected?.name || 'Choose your animal above'}</dd></div><div><dt className="text-muted-foreground">Provider</dt><dd className="font-medium">{item.organization_name}</dd></div><div><dt className="text-muted-foreground">Appointment time</dt><dd className="font-medium">{currentSlot ? bookingTime(start) : 'Choose an available time above'}</dd></div><div><dt className="text-muted-foreground">Base fee</dt><dd className="font-medium">{item.currency} {Number(item.base_price).toLocaleString('en-NG',{minimumFractionDigits:2})}</dd></div></dl>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{home ? 'Home visit. Your address is shared privately with this provider.' : item.delivery_mode==='clinic_visit' ? 'Visit the provider location; confirm the exact address with the provider.' : 'Confirm how and where care will take place with the provider before making arrangements.'} This is a request, not a confirmed appointment. No payment is collected.</p>
        </section>
        <div id="booking-readiness" role="status" className="rounded-xl border p-4 text-sm">
          {remaining.length?<><p className="font-medium mb-2">Before you can send your request</p><ul className="list-disc pl-5 space-y-1">{remaining.map(message=><li key={message}>{message}</li>)}</ul></>:<p>Ready to send. The provider will need to confirm your appointment.</p>}
        </div>
        <Button aria-describedby="booking-readiness" type="submit" disabled={busy || !ready}>{busy?'Submitting…':'Submit booking request'}</Button>
        {error&&<p role="alert" className="text-destructive">{error}</p>}
      </form>}
    </>}
  </main></div>;
}
