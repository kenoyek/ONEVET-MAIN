import { useRef, useState } from 'react';
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
  const [params]=useSearchParams();const id=params.get('service_id') ?? '';const {user,profile}=useAuth();const navigate=useNavigate();
  const [date,setDate]=useState(watDate());const [start,setStart]=useState('');const [animal,setAnimal]=useState('');const [phone,setPhone]=useState('');const [address,setAddress]=useState('');const [notes,setNotes]=useState('');const [consent,setConsent]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const retry=useRef({payload:'',key:''});
  const catalog=useQuery({queryKey:['booking-service',id],enabled:!!id,queryFn:()=>service.service(id),staleTime:0});
  const choices=useQuery({queryKey:['booking-animals',user?.id,profile?.id],enabled:!!profile?.id && profile.user_id===user?.id,queryFn:()=>service.animals(profile!.id)});
  const slots=useQuery({queryKey:['appointment-slots',id,date],enabled:!!id && !!date && !!catalog.data?.booking_enabled,queryFn:()=>service.slots(id,date),refetchInterval:60_000});
  const item=catalog.data;const home=item?.delivery_mode==='home_visit';const selected=choices.data?.find(choice=>`${choice.kind}:${choice.id}`===animal);
  const options=choices.data?.filter(choice=>choice.kind==='pet' || ['veterinary','diagnostics'].includes(item?.category ?? '')) ?? [];
  const limit=watDate(new Date(Date.parse(watDate()+'T12:00:00+01:00')+90*86400000));
  return <div className="min-h-screen bg-background"><Navbar/><main className="container-wide max-w-3xl pt-32 pb-20"><Link className="text-primary underline" to="/my-bookings">Your booking requests</Link>
    <h1 className="text-3xl my-6">Request a service appointment</h1>
    {!id?<p>Select a service from the <Link className="underline text-primary" to="/provider-marketplace">care directory</Link>.</p>:catalog.isPending?<p role="status">Loading service…</p>:catalog.isError || !item?<><p role="alert">This service is unavailable or could not be loaded.</p><Button onClick={()=>void catalog.refetch()}>Refresh service</Button></>:<>
      <section className="care-path mb-6"><h2 className="text-xl">{item.name}</h2><p>{item.organization_name} · {item.city}, {item.state}</p><p className="mt-3">Base fee: {item.currency} {Number(item.base_price).toLocaleString('en-NG',{minimumFractionDigits:2})} · {item.duration_minutes} minutes</p><p className="text-sm text-muted-foreground mt-3">No online payment is collected. The provider must confirm this request; submitting does not reserve a slot. Any additional costs must be agreed separately before care.</p><Button type="button" variant="outline" className="mt-4" disabled={busy} onClick={()=>{void catalog.refetch();void slots.refetch();setConsent(false);setStart('');}}>Refresh service details and times</Button></section>
      {!item.booking_enabled?<p>This provider is not accepting booking requests right now.</p>:choices.isPending?<p role="status">Loading your animals…</p>:choices.isError?<><p role="alert">Could not load your animals.</p><Button onClick={()=>void choices.refetch()}>Retry animals</Button></>:!options.length?<p>Add an owned <Link className="underline text-primary" to="/pets">animal profile</Link>{['veterinary','diagnostics'].includes(item.category ?? '')?' or farm group':''} before requesting this service.</p>:<form className="care-path space-y-5" onSubmit={async event=>{
        event.preventDefault();if(busy || !selected || !start || !consent)return;setBusy(true);setError('');
        const input={serviceId:id,serviceVersion:item.service_version!,start,animalId:selected.id,kind:selected.kind,phone,address:home?address:'',notes};const payload=JSON.stringify(input);
        if(retry.current.payload!==payload)retry.current={payload,key:crypto.randomUUID()};
        try{await service.request({...input,key:retry.current.key});navigate('/my-bookings');}
        catch(cause){setError(appointmentError(cause));void slots.refetch();if(typeof cause==='object' && cause && 'code' in cause && cause.code==='40001'){void catalog.refetch();setConsent(false);setStart('');}}
        finally{setBusy(false);}
      }}>
        <fieldset disabled={busy} className="space-y-5"><legend className="sr-only">Appointment request details</legend>
          <div><Label htmlFor="booking-animal">Animal or farm group</Label><select id="booking-animal" required className="w-full border rounded-md bg-background p-3" value={animal} onChange={event=>setAnimal(event.target.value)}><option value="">Choose your animal</option>{options.map(choice=><option key={`${choice.kind}:${choice.id}`} value={`${choice.kind}:${choice.id}`}>{choice.name} · {choice.species}{choice.kind==='farm_group'?' · farm group':''}</option>)}</select></div>
          <div><Label htmlFor="booking-date">Date · Africa/Lagos (WAT)</Label><Input id="booking-date" type="date" required min={watDate()} max={limit} value={date} onChange={event=>{setDate(event.target.value);setStart('');}}/></div>
          <div><Label htmlFor="booking-time">Available start time · WAT</Label>{slots.isPending?<p role="status">Loading times…</p>:slots.isError?<><p role="alert">Could not load times.</p><Button type="button" variant="outline" onClick={()=>void slots.refetch()}>Retry times</Button></>:<><select id="booking-time" required className="w-full border rounded-md bg-background p-3" value={start} onChange={event=>setStart(event.target.value)}><option value="">Choose a time</option>{slots.data?.map(slot=><option key={slot.start_at} value={slot.start_at}>{bookingTime(slot.start_at)}</option>)}</select>{!slots.data?.length&&<p className="text-sm mt-2">No times are available on this date. Choose another date.</p>}</>}</div>
          <div><Label htmlFor="booking-phone">Contact phone (shared privately with the provider)</Label><Input id="booking-phone" required minLength={7} maxLength={40} type="tel" value={phone} onChange={event=>setPhone(event.target.value)}/></div>
          {home&&<div><Label htmlFor="booking-address">Visit address (shared privately with the provider)</Label><Textarea id="booking-address" required minLength={10} maxLength={500} value={address} onChange={event=>setAddress(event.target.value)}/></div>}
          <div><Label htmlFor="booking-notes">Notes for the provider (optional)</Label><Textarea id="booking-notes" maxLength={2000} value={notes} onChange={event=>setNotes(event.target.value)}/></div>
          <label className="flex gap-3 items-start"><input type="checkbox" required checked={consent} onChange={event=>setConsent(event.target.checked)} className="mt-1"/>I understand this is a pending request, the recorded base fee is {item.currency} {Number(item.base_price).toLocaleString('en-NG')}, and my selected animal details, contact phone{home?' and visit address':''} will be shared with this provider.</label>
        </fieldset><Button type="submit" disabled={busy || !selected || !start || !consent || slots.isError || !slots.data?.some(slot=>slot.start_at===start)}>{busy?'Submitting…':'Submit booking request'}</Button>
        {error&&<p role="alert" className="text-destructive">{error}</p>}
      </form>}
    </>}
  </main></div>;
}
