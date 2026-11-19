import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { appointmentService, bookingTime } from '@/lib/services/appointment-service';
import { appointmentCalendar, downloadAppointmentCalendar } from '@/lib/appointment-calendar';
export function AppointmentCalendarDownload({bookingId}:{bookingId:string}){
  const {user}=useAuth();const scope=`${user?.id ?? ''}:${bookingId}`;const currentScope=useRef(scope);currentScope.current=scope;const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const inFlight=useRef(new Set<string>());
  const [action,setAction]=useState<{scope:string;busy:boolean;error:string;notice:string}|null>(null);
  const busy=!!action&&action.scope===scope&&action.busy;const error=action&&action.scope===scope?action.error:'';const notice=action&&action.scope===scope?action.notice:'';
  return <div className="rounded-lg bg-muted/40 p-4 space-y-3"><Button type="button" variant="outline" disabled={busy||!user} onClick={async()=>{
    if(inFlight.current.has(scope)||!user)return;const actor=user.id;const target=scope;inFlight.current.add(target);setAction({scope:target,busy:true,error:'',notice:''});
    try{const booking=await appointmentService.details(bookingId);if(!alive.current||currentScope.current!==target)return;const content=appointmentCalendar(booking,actor,window.location.origin);downloadAppointmentCalendar(content,booking.id);setAction({scope:target,busy:false,error:'',notice:`Calendar copy prepared for ${bookingTime(booking.start_at)}. Import the file into your calendar app.`});}
    catch{if(alive.current&&currentScope.current===target)setAction({scope:target,busy:false,notice:'',error:'Could not download the calendar copy. Refresh the appointment and check it is still confirmed with current provider approval.'});}
    finally{inFlight.current.delete(target);if(alive.current&&currentScope.current===target)setAction(previous=>previous?.scope===target?{...previous,busy:false}:previous);}
  }}>{busy?'Preparing calendar…':error?'Retry calendar download':'Download calendar copy'}</Button><p className="text-xs text-muted-foreground">This private calendar copy omits animal, phone and address details. It does not update automatically. Remove or replace earlier copies after cancellation or rescheduling, and check 1Vet before attending.</p>{error&&<p role="alert" className="text-destructive">{error}</p>}{notice&&<p role="status" className="rounded-xl border bg-background/60 p-3 text-sm">{notice}</p>}</div>;
}
