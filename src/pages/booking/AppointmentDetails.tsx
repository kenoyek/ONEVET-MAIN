import { bookingReturnPath } from '@/lib/booking-list-navigation';
import { useEffect } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { AppointmentConversation } from '@/components/provider/AppointmentConversation';
import { BookingRequestCard } from '@/components/provider/BookingRequestList';
import { useAuth } from '@/lib/auth-context';
import { appointmentService as service, bookingTime, snapshotText } from '@/lib/services/appointment-service';
export default function AppointmentDetails() {
  const { id='' }=useParams(); const { user }=useAuth();const cache=useQueryClient();
  const details=useQuery({queryKey:['appointment-detail',user?.id,id],enabled:!!user&&!!id,refetchInterval:60_000,queryFn:async()=>{
    const booking=await service.details(id);return{booking};
  }});
  async function refresh(){await Promise.all([cache.invalidateQueries({queryKey:['appointment-detail',user?.id]}),cache.invalidateQueries({queryKey:['appointment-replacements',user?.id]}),cache.invalidateQueries({queryKey:['booking-requests',user?.id]}),cache.invalidateQueries({queryKey:['appointment-slots']}),cache.invalidateQueries({queryKey:['reschedule-slots',user?.id]})]);}
  const booking=details.isError?undefined:details.data?.booking;
  const replacements=useQuery({queryKey:['appointment-replacements',user?.id,id,booking?.version],enabled:!!user&&!!booking&&!details.isError,refetchInterval:60_000,queryFn:()=>service.replacements(id)});
  const location=useLocation();
  useEffect(()=>{if(booking?.id&&location.hash==='#appointment-messages'){const target=document.getElementById('appointment-messages');target?.scrollIntoView?.({block:'start'});target?.focus({preventScroll:true});}},[booking?.id,location.hash]);
  return <div className="min-h-screen bg-background"><Navbar/><main id="main-content" tabIndex={-1} className="container-wide max-w-4xl pt-32 pb-20"><Link className="text-primary underline" to={bookingReturnPath(location.state?.bookingReturnTo)}>Back to booking requests</Link><PageHeading size="workspace" className="my-6" title={<> Appointment details </>}/>
    {details.isPending?<p role="status">Loading appointment…</p>:details.isError||!booking?<><p role="alert">Appointment unavailable. Check your connection and that you are signed into a participating account.</p><Button onClick={()=>void details.refetch()}>Retry appointment</Button></>:<>
      {booking.provider_access===true&&<Link className="text-primary underline block mb-4" to={`/provider/organization/${snapshotText(booking.service_snapshot,'provider_slug')}`}>Organization workspace</Link>}
      <BookingRequestCard key={`${user?.id}-${booking.id}`} booking={booking} provider={booking.provider_access===true&&booking.customer_id!==user?.id} readOnly={booking.provider_access!==true&&booking.customer_id!==user?.id} refresh={refresh}/>
      <section className="care-path mt-6" aria-label="Alternative appointment requests"><h2 className="text-xl mb-4">Alternative requests (latest 50)</h2>
        {replacements.isPending?<p role="status">Loading alternative requests…</p>:replacements.isError?<div role="alert"><p className="text-sm text-muted-foreground">Could not load alternative requests. Your appointment and conversation remain available.</p><Button className="mt-3" variant="outline" disabled={replacements.isFetching} onClick={()=>void replacements.refetch()}>Retry alternative requests</Button></div>:replacements.data?.length?<ul className="space-y-3">{replacements.data.map(row=><li key={row.id}><Link className="text-primary underline" state={{bookingReturnTo:bookingReturnPath(location.state?.bookingReturnTo)}} to={`/appointments/${row.id}`}>{bookingTime(row.start_at)}</Link> · {row.status}</li>)}</ul>:<p className="text-sm text-muted-foreground">No alternative requests to display.</p>}
      </section>
      <div id="appointment-messages" tabIndex={-1} className="scroll-mt-28"><AppointmentConversation bookingId={booking.id}/></div>
      <Button className="mt-6" variant="outline" onClick={()=>void refresh()}>Refresh appointment</Button>
    </>}
  </main></div>;
}
