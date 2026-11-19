import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { validateProviderSchedule } from '@/lib/provider-schedule-validation';
import { appointmentService as service, appointmentError, type BookingSchedule, type WeeklyWindow } from '@/lib/services/appointment-service';
const weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const timeLabel=(minutes:number)=>`${Math.floor(minutes/60).toString().padStart(2,'0')}:${(minutes%60).toString().padStart(2,'0')}`;
export function ProviderScheduleEditor({providerId,initial,refresh}:{providerId:string;initial:BookingSchedule|null;refresh:()=>Promise<void>}) {
  const [enabled,setEnabled]=useState(initial?.enabled??false);
  const [weekly,setWeekly]=useState<WeeklyWindow[]>(Array.isArray(initial?.weekly)?initial.weekly as WeeklyWindow[]:[]);
  const [closed,setClosed]=useState(initial?.closed_dates.join('\n')??'');
  const [version,setVersion]=useState(initial?.version??0);
  const [dirty,setDirty]=useState(false);
  const [busy,setBusy]=useState(false);
  const [review,setReview]=useState(false);
  const [errors,setErrors]=useState<string[]>([]);
  const [message,setMessage]=useState('');
  const lock=useRef(false),active=useRef(true);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  const newer=(initial?.version??0)>version;
  const needsReview=review||newer;
  function changed(){setDirty(true);setErrors([]);setMessage('');}
  function edit(weekday:number,field:'opens'|'closes',value:number){changed();setWeekly(previous=>previous.map(day=>day.weekday===weekday?{...day,[field]:value}:day));}
  async function reload(){
    if(lock.current)return;lock.current=true;setBusy(true);setErrors([]);
    try {
      const saved=await service.schedule(providerId);if(!active.current)return;
      setEnabled(saved?.enabled??false);setWeekly(Array.isArray(saved?.weekly)?saved.weekly as WeeklyWindow[]:[]);setClosed(saved?.closed_dates.join('\n')??'');setVersion(saved?.version??0);setDirty(false);setReview(false);setMessage('Saved schedule loaded. Review it before making changes.');
      try{await refresh();}catch{if(active.current)setMessage('Saved schedule loaded. Refresh the workspace to recheck its latest view.');}
    }catch{if(active.current)setErrors(['Could not load the saved schedule. Your current entries remain here; try again.']);}
    finally{lock.current=false;if(active.current)setBusy(false);}
  }
  return <form aria-busy={busy} className="space-y-4 mb-8" onSubmit={async event=>{
    event.preventDefault();if(lock.current||needsReview)return;
    const checked=validateProviderSchedule(weekly,closed);setErrors(checked.errors);setMessage('');if(checked.errors.length)return;
    lock.current=true;setBusy(true);
    try {
      const savedVersion=await service.saveSchedule(providerId,enabled,weekly,checked.dates,version);if(!active.current)return;
      if(!Number.isSafeInteger(savedVersion)||savedVersion<=version)throw new Error('No schedule save acknowledgement');
      setVersion(savedVersion);setDirty(false);setReview(false);setMessage('Schedule saved. Existing confirmations keep their recorded time.');toast.success('Availability saved');
      try{await refresh();}catch{if(active.current)setMessage('Schedule saved. Refresh the workspace to see its latest view; do not repeat the same save.');}
    }catch(cause){if(active.current){setErrors([appointmentError(cause)]);if(typeof cause==='object'&&cause&&'code'in cause&&['40001','42501'].includes(String(cause.code)))setReview(true);}}
    finally{lock.current=false;if(active.current)setBusy(false);}
  }}>
    {needsReview&&<section className="rounded-xl border bg-muted/20 p-4 space-y-3" aria-label="Review saved schedule"><p className="text-sm">The schedule or your access has changed. Your entries are retained here. Loading the saved schedule replaces these unsaved entries; review or copy them first.</p><Button type="button" variant="outline" disabled={busy} onClick={()=>void reload()}>Load latest saved schedule</Button></section>}
    <fieldset disabled={busy} className="space-y-4"><legend className="font-medium mb-3">Weekly availability · Africa/Lagos (WAT)</legend>
      <label className="flex gap-3"><input type="checkbox" checked={enabled} onChange={event=>{changed();setEnabled(event.target.checked);}}/>Accept booking requests for published services</label>
      <p className="text-sm text-muted-foreground">One shared calendar for this owner account, including its organizations. Choose one opening window per day. Requests require 30 minutes' notice and can be made up to 90 days ahead. Pending requests do not reserve slots; confirmed appointments do. Pausing or changing hours does not cancel existing confirmations.</p>
      {enabled&&!weekly.length&&<p role="status" className="rounded-xl border p-3 text-sm">No opening windows are selected. Clients will not see available times until you add hours.</p>}
      {weekdays.map((label,weekday)=>{const window=weekly.find(day=>day.weekday===weekday);return <div key={weekday} className="flex flex-wrap gap-3 items-center border-b pb-3">
        <label className="flex gap-2 w-32"><input type="checkbox" checked={!!window} onChange={event=>{changed();setWeekly(previous=>event.target.checked?[...previous,{weekday,opens:540,closes:1020}]:previous.filter(day=>day.weekday!==weekday));}}/>{label}</label>
        {window&&<><label className="text-sm">Opens <select aria-label={`${label} opens`} className="border rounded bg-background p-2" value={window.opens} onChange={event=>edit(weekday,'opens',Number(event.target.value))}>{Array.from({length:96},(_,index)=>index*15).map(minutes=><option key={minutes} value={minutes}>{timeLabel(minutes)}</option>)}</select></label><label className="text-sm">Closes <select aria-label={`${label} closes`} className="border rounded bg-background p-2" value={window.closes} onChange={event=>edit(weekday,'closes',Number(event.target.value))}>{Array.from({length:96},(_,index)=>(index+1)*15).map(minutes=><option key={minutes} value={minutes}>{timeLabel(minutes)}</option>)}</select></label></>}
      </div>;})}
      <div><Label htmlFor="booking-closed-dates">Closed dates (YYYY-MM-DD, one per line, up to 60 unique dates)</Label><Textarea id="booking-closed-dates" maxLength={2000} value={closed} onChange={event=>{changed();setClosed(event.target.value);}}/></div>
    </fieldset>
    <Button disabled={busy||needsReview} type="submit">{busy?'Saving or loading…':'Save availability'}</Button>
    {dirty&&!message&&<p role="status" className="text-sm text-muted-foreground">You have unsaved schedule changes.</p>}
    {!!errors.length&&<div role="alert" className="rounded-xl border border-destructive/25 p-4 text-sm text-destructive"><ul className="list-disc pl-5 space-y-2">{errors.map(error=><li key={error}>{error}</li>)}</ul></div>}
    {message&&<p role="status" className="rounded-xl border bg-primary/5 p-4 text-sm">{message}</p>}
  </form>;
}
