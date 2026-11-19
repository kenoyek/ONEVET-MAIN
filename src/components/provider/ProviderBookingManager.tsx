import { ProviderScheduleEditor } from './ProviderScheduleEditor';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { BookingRequestList } from './BookingRequestList';
import { appointmentService as service } from '@/lib/services/appointment-service';
export function ProviderBookingManager({ providerId }: { providerId:string }) {
  const {user}=useAuth();const cache=useQueryClient();
  const schedule=useQuery({queryKey:['provider-booking-schedule',user?.id,providerId],enabled:!!user,queryFn:()=>service.schedule(providerId)});
  async function refresh(){await Promise.all([cache.invalidateQueries({queryKey:['provider-booking-schedule',user?.id,providerId]}),cache.invalidateQueries({queryKey:['public-provider']}),cache.invalidateQueries({queryKey:['provider-marketplace']})]);}
  return <section id="organization-availability" className="care-path mb-8 scroll-mt-28"><h2 className="text-xl mb-4">Availability and booking requests</h2>
    {schedule.isPending?<p role="status">Loading schedule…</p>:schedule.isError?<><p role="alert">Could not load schedule.</p><Button onClick={()=>void schedule.refetch()}>Refresh schedule</Button></>:<ProviderScheduleEditor key={`${user?.id}:${providerId}`} providerId={providerId} initial={schedule.data ?? null} refresh={refresh} />}
    <BookingRequestList providerId={providerId}/>
  </section>;
}
