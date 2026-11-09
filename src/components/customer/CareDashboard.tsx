import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/auth-context';
import {Button} from '@/components/ui/button';
import {careDashboardService as service,careDashboardWindow} from '@/lib/services/care-dashboard-service';
import {bookingTime,snapshotText} from '@/lib/services/appointment-service';
import {journalDueLabel} from '@/lib/services/pet-health-journal-service';

function Panel({title,loading,error,retry,children}:{title:string;loading:boolean;error:boolean;retry:()=>void;children:ReactNode}){
 return <section className="care-path space-y-4 min-w-0"><h3 className="text-xl">{title}</h3>
  {loading?<p role="status">Loading {title.toLowerCase()}…</p>:error?<><p role="alert">Could not load {title.toLowerCase()}. Refresh before relying on this summary.</p><Button variant="outline" onClick={retry}>Retry {title.toLowerCase()}</Button></>:children}
 </section>;
}
function Overview({userId,ownerId}:{userId:string;ownerId:string}){
 const options={refetchInterval:60_000,staleTime:0};
 const appointments=useQuery({...options,queryKey:['care-dashboard',userId,ownerId,'appointments'],queryFn:()=>service.appointments(userId)});
 const dates=useQuery({...options,queryKey:['care-dashboard',userId,ownerId,'vaccination-dates'],queryFn:()=>service.vaccinationDates(ownerId)});
 const observations=useQuery({...options,queryKey:['care-dashboard',userId,ownerId,'observations'],queryFn:()=>service.observations(ownerId)});
 const refreshing=appointments.isFetching||dates.isFetching||observations.isFetching;
 return <section aria-labelledby="care-dashboard-title" className="space-y-5 mb-8">
  <div className="flex flex-wrap gap-4 items-center justify-between"><div><h2 id="care-dashboard-title" className="text-2xl">Your care at a glance</h2><p className="text-sm text-muted-foreground mt-2">A preview of your appointments and owner-reported pet journal.</p></div><Button variant="outline" disabled={refreshing} onClick={()=>void Promise.all([appointments.refetch(),dates.refetch(),observations.refetch()])}>{refreshing?'Refreshing care summary…':'Refresh care summary'}</Button></div>
  <div className="grid lg:grid-cols-3 gap-5">
   <Panel title="Upcoming appointments" loading={appointments.isPending} error={appointments.isError} retry={()=>void appointments.refetch()}>
    <p className="text-sm text-muted-foreground">Pending requests need provider confirmation. No online payment is collected.</p>
    {!appointments.data?.rows.length?<p>No upcoming requests to display. <Link className="underline text-primary" to="/provider-marketplace">Browse care services</Link>.</p>:<ul className="divide-y">{appointments.data.rows.map(booking=><li key={booking.id} className="py-3 space-y-2"><Link className="font-medium text-primary underline break-words" to={`/appointments/${booking.id}`}>{snapshotText(booking.service_snapshot,'name')||'Appointment request'}</Link><p className="text-sm break-words">{snapshotText(booking.service_snapshot,'organization_name')}</p><p className="text-sm">{bookingTime(booking.start_at)}</p><p className="text-sm">{booking.status==='pending'?'Awaiting provider confirmation':'Confirmed'}</p></li>)}</ul>}
    {appointments.data?.hasMore&&<p className="text-xs text-muted-foreground">Showing the next four requests. More are available in your appointments.</p>}
    <Link className="text-primary underline text-sm inline-block" to="/my-bookings">View all appointments</Link>
   </Panel>
   <Panel title="Vaccination dates you recorded" loading={dates.isPending} error={dates.isError} retry={()=>void dates.refetch()}>
    <p className="text-sm text-muted-foreground">Past dates and the next 30 days from your journal. These dates are owner-supplied; confirm the schedule with your vet. No automatic reminders are sent.</p>
    {!dates.data?.rows.length?<p>No recorded vaccination due dates in this window. This does not confirm vaccination status.</p>:<ul className="divide-y">{dates.data.rows.map(entry=><li key={entry.id} className="py-3 space-y-2"><Link className="font-medium text-primary underline break-words" to={`/pets/${entry.pet_id}#health-journal`}>{entry.pets.name} · {entry.title}</Link><p className="text-sm">{entry.next_due_on&&journalDueLabel(entry.next_due_on,careDashboardWindow().today)}: {entry.next_due_on}</p></li>)}</ul>}
    {dates.data?.hasMore&&<p className="text-xs text-muted-foreground">Showing four dates, oldest first. Open your pet journals for all recorded dates.</p>}
    <Link className="text-primary underline text-sm inline-block" to="/pets">Open pet journals</Link>
   </Panel>
   <Panel title="Latest journal observations" loading={observations.isPending} error={observations.isError} retry={()=>void observations.refetch()}>
    <p className="text-sm text-muted-foreground">Owner-reported observations, ordered by observation date. Entries marked incorrect are excluded from this preview.</p>
    {!observations.data?.rows.length?<p>No owner observations to display. <Link className="underline text-primary" to="/pets">Open a pet profile</Link> to start its journal.</p>:<ul className="divide-y">{observations.data.rows.map(entry=><li key={entry.id} className="py-3 space-y-2"><Link className="font-medium text-primary underline break-words" to={`/pets/${entry.pet_id}#health-journal`}>{entry.pets.name} · {entry.title}</Link><p className="text-sm">{entry.occurred_on} · Owner-reported{entry.entry_type==='weight'?` · ${entry.weight_kg} kg`:''}</p></li>)}</ul>}
    {observations.data?.hasMore&&<p className="text-xs text-muted-foreground">Showing four observations. Open each pet journal for its full history and corrections.</p>}
    <Link className="text-primary underline text-sm inline-block" to="/pets">View pet profiles</Link>
   </Panel>
  </div>
 </section>;
}
export function CareDashboard(){
 const{user,profile}=useAuth();
 if(!user)return null;
 if(!profile||profile.user_id!==user.id)return <p role="status" className="mb-8">Checking your care profile…</p>;
 if(profile.is_active!==true)return <p role="alert" className="mb-8">An active owner profile is required to load your care summary.</p>;
 return <Overview key={`${user.id}:${profile.id}`} userId={user.id} ownerId={profile.id}/>;
}
