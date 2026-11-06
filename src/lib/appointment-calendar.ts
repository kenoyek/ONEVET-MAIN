import type { Appointment } from '@/lib/services/appointment-service';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function stamp(value:string|Date){
  const date=value instanceof Date?value:new Date(value);
  if(!Number.isFinite(date.getTime())||date.getUTCFullYear()<1000||date.getUTCFullYear()>9999)throw new Error('Appointment date is unavailable.');
  return date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
}
function fold(line:string){
  const result:string[]=[];let part='';let bytes=0;
  for(const character of line){const size=new TextEncoder().encode(character).length;if(bytes+size>75){result.push(part);part=' ';bytes=1;}part+=character;bytes+=size;}
  result.push(part);return result.join('\r\n');
}
export function appointmentCalendar(booking:Appointment,actor:string,origin:string,now=new Date()){
  if(actor!==booking.customer_id&&actor!==booking.provider_owner_id)throw new Error('Only appointment participants can download a calendar copy.');
  if(booking.status!=='confirmed'||new Date(booking.end_at)<=now||booking.provider_eligibility!=='eligible')throw new Error('A current confirmed appointment with verified provider eligibility is required.');
  if(!uuid.test(booking.id)||!Number.isInteger(booking.version)||booking.version<1||!(new Date(booking.end_at)>new Date(booking.start_at)))throw new Error('Appointment details are unavailable.');
  const base=new URL(origin);
  if(!['http:','https:'].includes(base.protocol)||base.origin!==origin)throw new Error('Calendar destination is unavailable.');
  const url=new URL(`/appointments/${booking.id}`,base).href;
  // Keep sensitive animal, contact, address and clinical fields out of shared calendars.
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//1Vet//Appointments//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',`UID:${booking.id}@appointments.onevet.app`,`DTSTAMP:${stamp(now)}`,`DTSTART:${stamp(booking.start_at)}`,`DTEND:${stamp(booking.end_at)}`,`LAST-MODIFIED:${stamp(booking.updated_at)}`,`SEQUENCE:${booking.version}`,'STATUS:CONFIRMED','CLASS:PRIVATE','TRANSP:OPAQUE','SUMMARY:1Vet appointment','DESCRIPTION:Confirmed appointment. Review current details in 1Vet before attending. This copy does not update automatically.',`URL:${url}`,'END:VEVENT','END:VCALENDAR'];
  return lines.map(fold).join('\r\n')+'\r\n';
}
export function downloadAppointmentCalendar(content:string,id:string){
  const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=`1vet-appointment-${id.slice(0,8)}.ics`;anchor.rel='noopener';document.body.append(anchor);
  try{anchor.click();}finally{anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
