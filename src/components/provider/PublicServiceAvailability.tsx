import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { appointmentService, bookingTime } from '@/lib/services/appointment-service';
import { bookingDateRange } from '@/lib/booking-date-range';

export function PublicServiceAvailability({ serviceId, version }: { serviceId: string; version: number }) {
  const { user } = useAuth();
  const { today, last } = bookingDateRange();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today);
  const [selected, setSelected] = useState('');
  const validDate = !!date && date >= today && date <= last;
  const times = useQuery({ queryKey: ['appointment-slots', serviceId, date, version], queryFn: () => appointmentService.slots(serviceId, date), enabled: open && validDate, staleTime: 0, refetchInterval: open ? 60_000 : false });
  const current = !times.isError && !times.isFetching && times.data?.some(slot => slot.start_at === selected);
  const query = new URLSearchParams({service_id:serviceId,date,start:selected});
  return <div className="mt-5 border-t pt-4">
    <Button type="button" variant="outline" aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? 'Hide available times' : 'Check available times'}</Button>
    {open && <div className="mt-4 space-y-4">
      <div><Label htmlFor={`public-date-${serviceId}`}>Appointment date · WAT</Label><Input id={`public-date-${serviceId}`} type="date" min={today} max={last} value={date} onChange={event => { setDate(event.target.value); setSelected(''); }} /></div>
      {!validDate ? <p className="text-sm">Choose a date between {today} and {last}.</p> : times.isPending || times.isFetching ? <p role="status" className="text-sm">Checking available times…</p> : times.isError ? <div role="alert"><p className="text-sm">We couldn’t check availability. Please try again.</p><Button type="button" variant="link" onClick={() => void times.refetch()}>Retry availability</Button></div> : !times.data?.length ? <p className="text-sm text-muted-foreground">No times are available on this date. Try another date or provider.</p> : <div role="group" aria-label="Available appointment times" className="flex flex-wrap gap-2">{times.data.map(slot => <Button type="button" size="sm" variant={selected === slot.start_at ? 'default' : 'outline'} key={slot.start_at} aria-pressed={selected === slot.start_at} onClick={() => setSelected(slot.start_at)}>{bookingTime(slot.start_at)}</Button>)}</div>}
      {current && <Button asChild className="w-full whitespace-normal h-auto min-h-11 py-3"><Link to={`/booking/new?${query}`}>{user ? 'Continue with this time' : 'Sign in to request this time'}</Link></Button>}
      <p className="text-xs leading-relaxed text-muted-foreground">Times use Africa/Lagos (WAT). Availability is checked again before submission. A request does not reserve a slot until the provider confirms. No online payment is collected.</p>
    </div>}
  </div>;
}
