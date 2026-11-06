import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { BookingRequestCard } from '@/components/provider/BookingRequestList';
import { useAuth } from '@/lib/auth-context';
import { appointmentService as service, bookingTime, snapshotText } from '@/lib/services/appointment-service';
export default function AppointmentDetails() {
  const { id='' }=useParams(); const { user }=useAuth();const cache=useQueryClient();
  const details=useQuery({queryKey:['appointment-detail',user?.id,id],enabled:!!user&&!!id,refetchInterval:60_000,queryFn:async()=>{
    const booking=await service.details(id);const replacements=await service.replacements(id);return{booking,replacements};
  }});
  async function refresh(){await Promise.all([cache.invalidateQueries({queryKey:['appointment-detail',user?.id]}),cache.invalidateQueries({queryKey:['booking-requests',user?.id]}),cache.invalidateQueries({queryKey:['appointment-slots']}),cache.invalidateQueries({queryKey:['reschedule-slots',user?.id]})]);}
  const booking=details.data?.booking;
  return <div className="min-h-screen bg-background"><Navbar/><main className="container-wide max-w-4xl pt-32 pb-20"><Link className="text-primary underline" to="/my-bookings">Your booking requests</Link><h1 className="text-3xl my-6">Appointment details</h1>
    {details.isPending?<p role="status">Loading appointment…</p>:details.isError||!booking?<><p role="alert">Appointment unavailable. Check your connection and that you are signed into a participating account.</p><Button onClick={()=>void details.refetch()}>Retry appointment</Button></>:<>
      {booking.provider_owner_id===user?.id&&<Link className="text-primary underline block mb-4" to={`/provider/organization/${snapshotText(booking.service_snapshot,'provider_slug')}`}>Organization workspace</Link>}
      <BookingRequestCard key={`${user?.id}-${booking.id}`} booking={booking} provider={booking.provider_owner_id===user?.id} readOnly={booking.provider_owner_id!==user?.id&&booking.customer_id!==user?.id} refresh={refresh}/>
      {!!details.data?.replacements.length&&<section className="care-path mt-6"><h2 className="text-xl mb-4">Alternative requests (latest 50)</h2><ul className="space-y-3">{details.data.replacements.map(row=><li key={row.id}><Link className="text-primary underline" to={`/appointments/${row.id}`}>{bookingTime(row.start_at)}</Link> · {row.status}</li>)}</ul></section>}
      <Button className="mt-6" variant="outline" onClick={()=>void refresh()}>Refresh appointment</Button>
    </>}
  </main></div>;
}
