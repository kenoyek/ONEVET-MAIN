import {useEffect,useRef,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/auth-context';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {watDate} from '@/lib/services/appointment-service';
import {petHealthJournalService as service,journalError,journalDueLabel,type OwnerHealthInput} from '@/lib/services/pet-health-journal-service';
function Journal({petId,userId}:{petId:string;userId:string}){
 const cache=useQueryClient();const[page,setPage]=useState(0);const[kind,setKind]=useState<OwnerHealthInput['kind']>('weight');const[date,setDate]=useState(watDate());const[title,setTitle]=useState('');const[notes,setNotes]=useState('');const[weight,setWeight]=useState('');const[due,setDue]=useState('');const[busy,setBusy]=useState(false);const[error,setError]=useState('');const[feedback,setFeedback]=useState('');const[correcting,setCorrecting]=useState<string|null>(null);const[reason,setReason]=useState('');const retry=useRef({payload:'',key:''});const today=watDate();
 const access=useQuery({queryKey:['pet-health-journal',userId,petId,'access'],queryFn:()=>service.access(petId),refetchInterval:30_000});
 const entries=useQuery({queryKey:['pet-health-journal',userId,petId,'entries',page],enabled:access.data===true&&!access.isError,queryFn:()=>service.list(petId,page)});
 useEffect(()=>{if(access.isSuccess&&window.location.hash==='#health-journal')document.getElementById('health-journal')?.scrollIntoView?.({block:'start'});},[access.isSuccess]);
 async function refresh(){await Promise.all([cache.invalidateQueries({queryKey:['pet-health-journal',userId,petId]}),cache.invalidateQueries({queryKey:['care-dashboard',userId]})]);}
 return <section id="health-journal" className="care-path scroll-mt-24 mb-6 space-y-5" aria-labelledby="pet-journal-title">
  <h2 id="pet-journal-title" className="text-xl">Owner health journal</h2>
  <p className="text-sm text-muted-foreground">Record observations, weight and vaccinations you report. These entries are not verified clinical records or vaccination certificates. Due dates come from you; confirm them with your veterinarian. No automatic reminders are sent.</p>
  {access.isPending?<p role="status">Checking journal access…</p>:access.isError?<><p role="alert">This journal could not be loaded, or your access changed.</p><Button variant="outline" onClick={()=>void access.refetch()}>Retry journal</Button></>:<>
   <form className="space-y-4" onSubmit={async event=>{event.preventDefault();if(busy)return;const input:OwnerHealthInput={kind,date,title:kind==='weight'?'Weight observation':title.trim(),notes:notes.trim(),weight:kind==='weight'?Number(weight):null,dueDate:kind==='vaccination'&&due?due:null};const payload=JSON.stringify(input);if(retry.current.payload!==payload)retry.current={payload,key:crypto.randomUUID()};setBusy(true);setError('');setFeedback('');try{await service.add(petId,input,retry.current.key);setTitle('');setNotes('');setWeight('');setDue('');retry.current={payload:'',key:''};setPage(0);setFeedback('Owner-reported entry saved.');await refresh();}catch(cause){setError(journalError(cause));void access.refetch();}finally{setBusy(false);}}}>
    <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
     <div className="space-y-2"><Label htmlFor="journal-kind">Entry type</Label><select id="journal-kind" value={kind} onChange={event=>setKind(event.target.value as OwnerHealthInput['kind'])} className="w-full border rounded-md p-2 bg-background"><option value="weight">Weight</option><option value="vaccination">Vaccination</option><option value="note">Care note</option></select></div>
     <div className="space-y-2"><Label htmlFor="journal-date">Observation date (WAT)</Label><Input id="journal-date" type="date" required min="1900-01-01" max={today} value={date} onChange={event=>setDate(event.target.value)}/></div>
     {kind==='weight'?<div className="space-y-2"><Label htmlFor="journal-weight">Weight (kg)</Label><Input id="journal-weight" type="number" required min="0.001" max="10000" step="any" value={weight} onChange={event=>setWeight(event.target.value)}/><p className="text-xs text-muted-foreground">This historical entry does not change the profile weight.</p></div>:<div className="space-y-2"><Label htmlFor="journal-title">{kind==='vaccination'?'Vaccine name':'Note title'}</Label><Input id="journal-title" required maxLength={120} value={title} onChange={event=>setTitle(event.target.value)}/></div>}
     {kind==='vaccination'&&<div className="space-y-2"><Label htmlFor="journal-due">Next due date (optional)</Label><Input id="journal-due" type="date" min={date} value={due} onChange={event=>setDue(event.target.value)}/></div>}
     <div className="space-y-2 sm:col-span-2"><Label htmlFor="journal-notes">Your notes (optional)</Label><Textarea id="journal-notes" maxLength={2000} value={notes} onChange={event=>setNotes(event.target.value)}/></div>
     <Button type="submit" disabled={busy||entries.isError}>{busy?'Saving…':'Save owner-reported entry'}</Button>
    </fieldset>
   </form>
   <div className="flex flex-wrap gap-3 items-center"><h3 className="font-medium">Recorded history</h3><Button variant="outline" onClick={()=>void refresh()}>Refresh journal</Button></div>
   {entries.isPending?<p role="status">Loading journal entries…</p>:entries.isError?<><p role="alert">Could not load journal history. Your draft is retained.</p><Button onClick={()=>void entries.refetch()} variant="outline">Retry history</Button></>:!entries.data?.rows.length?<p>No entries on this page.</p>:<ol className="space-y-4">{entries.data.rows.map(entry=><li key={entry.id} className="rounded-lg border p-4 space-y-2">
    <p className="font-medium">{entry.title}{entry.entry_type==='weight'?` · ${entry.weight_kg} kg`:''}</p><p className="text-sm text-muted-foreground">{entry.occurred_on} · Owner-reported{entry.voided_at?' · Marked incorrect':''}</p>
    {entry.notes&&<p className="whitespace-pre-wrap break-words">{entry.notes}</p>}
    {!entry.voided_at&&entry.next_due_on&&<p className="text-sm">{journalDueLabel(entry.next_due_on,today)}: {entry.next_due_on}</p>}
    {entry.voided_at?<p className="text-sm whitespace-pre-wrap break-words">Correction reason: {entry.void_reason}</p>:correcting===entry.id?<form className="space-y-3" onSubmit={async event=>{event.preventDefault();if(busy)return;setBusy(true);setError('');setFeedback('');try{await service.voidEntry(entry.id,reason);setCorrecting(null);setReason('');setFeedback('Entry marked incorrect. Original content is retained.');await refresh();}catch(cause){setError(journalError(cause));void access.refetch();}finally{setBusy(false);}}}><Label htmlFor="journal-reason">Why is this entry incorrect?</Label><Textarea id="journal-reason" required minLength={5} maxLength={500} disabled={busy} value={reason} onChange={event=>setReason(event.target.value)}/><div className="flex gap-3"><Button disabled={busy||reason.trim().length<5} type="submit">Confirm correction</Button><Button variant="outline" type="button" disabled={busy} onClick={()=>{setCorrecting(null);setReason('');}}>Cancel correction</Button></div></form>:<Button variant="outline" disabled={busy} onClick={()=>{setCorrecting(entry.id);setReason('');}}>Mark incorrect</Button>}
   </li>)}</ol>}
   <div className="flex gap-3 items-center"><Button variant="outline" disabled={!page||entries.isFetching||busy} onClick={()=>{setPage(page-1);setCorrecting(null);}}>Previous entries</Button><span>Page {page+1}</span><Button variant="outline" disabled={!entries.data?.hasNext||entries.isFetching||busy} onClick={()=>{setPage(page+1);setCorrecting(null);}}>Next entries</Button></div>
   <p className="text-xs text-muted-foreground">To correct an entry, mark it incorrect with a reason, then add a replacement. Original content stays in the journal while the pet profile exists.</p>
  </>}
  {error&&<p role="alert" className="text-destructive">{error}</p>}{feedback&&<p role="status">{feedback}</p>}
 </section>;
}
export function PetHealthJournal({petId}:{petId:string}){const{user}=useAuth();return user?<Journal key={`${user.id}:${petId}`} petId={petId} userId={user.id}/>:null;}
