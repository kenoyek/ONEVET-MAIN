import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { appointmentService } from '@/lib/services/appointment-service';
import { appointmentCalendar, downloadAppointmentCalendar } from '@/lib/appointment-calendar';
export function AppointmentCalendarDownload({bookingId}:{bookingId:string}){
  const {user}=useAuth();const scope=`${user?.id ?? ''}:${bookingId}`;const currentScope=useRef(scope);currentScope.current=scope;const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const [action,setAction]=useState<{scope:string;busy:boolean;error:string}|null>(null);
  const busy=!!action&&action.scope===scope&&action.busy;const error=action&&action.scope===scope?action.error:'';
  return <div className="rounded-lg bg-muted/40 p-4 space-y-3"><Button variant="outline" disabled={busy||!user} onClick={async()=>{
    if(busy||!user)return;const actor=user.id;const target=scope;setAction({scope:target,busy:true,error:''});
    try{const booking=await appointmentService.details(bookingId);if(!alive.current||currentScope.current!==target)return;const content=appointmentCalendar(booking,actor,window.location.origin);downloadAppointmentCalendar(content,booking.id);}
    catch{if(alive.current&&currentScope.current===target)setAction({scope:target,busy:false,error:'Could not download the calendar copy. Refresh the appointment and check it is still confirmed with current provider approval.'});}
    finally{if(alive.current&&currentScope.current===target)setAction(previous=>previous?.scope===target?{...previous,busy:false}:previous);}
  }}>{busy?'Preparing calendar…':'Download calendar copy'}</Button><p className="text-xs text-muted-foreground">This private calendar copy omits animal, phone and address details. It does not update automatically. Remove or replace earlier copies after cancellation or rescheduling, and check 1Vet before attending.</p>{error&&<p role="alert" className="text-destructive">{error}</p>}</div>;
}
