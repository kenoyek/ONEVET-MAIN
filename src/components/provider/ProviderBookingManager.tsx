import { toast } from 'sonner';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookingRequestList } from './BookingRequestList';
import { appointmentService as service, appointmentError, type BookingSchedule, type WeeklyWindow } from '@/lib/services/appointment-service';
const weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const timeLabel=(minutes:number)=>`${Math.floor(minutes/60).toString().padStart(2,'0')}:${(minutes%60).toString().padStart(2,'0')}`;
function ScheduleEditor({ providerId, initial, refresh }: { providerId: string; initial: BookingSchedule|null; refresh: () => Promise<void> }) {
  const [enabled,setEnabled]=useState(initial?.enabled ?? false);
  const [weekly,setWeekly]=useState<WeeklyWindow[]>(Array.isArray(initial?.weekly) ? initial.weekly as WeeklyWindow[] : []);
  const [closed,setClosed]=useState(initial?.closed_dates.join('\n') ?? '');
  const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [message,setMessage]=useState('');
  const edit=(weekday:number,field:'opens'|'closes',value:number)=>setWeekly(previous=>previous.map(day=>day.weekday===weekday ? {...day,[field]:value}:day));
  return <form className="space-y-4 mb-8" onSubmit={async event=>{
    event.preventDefault(); if(busy)return; setBusy(true);setError('');setMessage('');
    try { await service.saveSchedule(providerId,enabled,weekly,closed.split(/\s+/).filter(Boolean),initial?.version ?? 0);setMessage('Schedule saved. Existing confirmations keep their recorded time.');toast.success('Availability saved');await refresh(); }
    catch(cause){setError(appointmentError(cause));}finally{setBusy(false);}
  }}>
    <fieldset disabled={busy} className="space-y-4"><legend className="font-medium mb-3">Weekly availability · Africa/Lagos (WAT)</legend>
      <label className="flex gap-3"><input type="checkbox" checked={enabled} onChange={event=>setEnabled(event.target.checked)} />Accept booking requests for published services</label>
      <p className="text-sm text-muted-foreground">One shared calendar for this owner account, including its organizations. Choose one opening window per day. Requests require 30 minutes' notice and can be made up to 90 days ahead. Pending requests do not reserve slots; confirmed appointments do. Pausing or changing hours does not cancel existing confirmations.</p>
      {weekdays.map((label,weekday)=>{const window=weekly.find(day=>day.weekday===weekday);return <div key={weekday} className="flex flex-wrap gap-3 items-center border-b pb-3">
        <label className="flex gap-2 w-32"><input type="checkbox" checked={!!window} onChange={event=>setWeekly(previous=>event.target.checked ? [...previous,{weekday,opens:540,closes:1020}] : previous.filter(day=>day.weekday!==weekday))} />{label}</label>
        {window && <><label className="text-sm">Opens <select aria-label={`${label} opens`} className="border rounded bg-background p-2" value={window.opens} onChange={event=>edit(weekday,'opens',Number(event.target.value))}>{Array.from({length:96},(_,index)=>index*15).map(minutes=><option key={minutes} value={minutes}>{timeLabel(minutes)}</option>)}</select></label><label className="text-sm">Closes <select aria-label={`${label} closes`} className="border rounded bg-background p-2" value={window.closes} onChange={event=>edit(weekday,'closes',Number(event.target.value))}>{Array.from({length:96},(_,index)=>(index+1)*15).map(minutes=><option key={minutes} value={minutes}>{timeLabel(minutes)}</option>)}</select></label></>}
      </div>;})}
      <div><Label htmlFor="booking-closed-dates">Closed dates (YYYY-MM-DD, one per line, up to 60)</Label><Textarea id="booking-closed-dates" value={closed} onChange={event=>setClosed(event.target.value)} /></div>
    </fieldset><Button disabled={busy} type="submit">{busy?'Saving…':'Save availability'}</Button>
    {error&&<p role="alert" className="text-destructive">{error}</p>}{message&&<p role="status">{message}</p>}
  </form>;
}
export function ProviderBookingManager({ providerId }: { providerId:string }) {
  const {user}=useAuth();const cache=useQueryClient();
  const schedule=useQuery({queryKey:['provider-booking-schedule',user?.id,providerId],enabled:!!user,queryFn:()=>service.schedule(providerId)});
  async function refresh(){await Promise.all([cache.invalidateQueries({queryKey:['provider-booking-schedule',user?.id,providerId]}),cache.invalidateQueries({queryKey:['public-provider']}),cache.invalidateQueries({queryKey:['provider-marketplace']})]);}
  return <section className="care-path mb-8"><h2 className="text-xl mb-4">Availability and booking requests</h2>
    {schedule.isPending?<p role="status">Loading schedule…</p>:schedule.isError?<><p role="alert">Could not load schedule.</p><Button onClick={()=>void schedule.refetch()}>Refresh schedule</Button></>:<ScheduleEditor key={schedule.data?.version ?? 0} providerId={providerId} initial={schedule.data ?? null} refresh={refresh} />}
    <BookingRequestList providerId={providerId}/>
  </section>;
}
