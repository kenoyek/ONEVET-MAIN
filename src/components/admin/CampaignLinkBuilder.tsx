import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {campaignDestinations,campaignLink} from '@/lib/analytics-navigation';
export function CampaignLinkBuilder(){
 const [destination,setDestination]=useState('/marketplace');const [source,setSource]=useState('');const [medium,setMedium]=useState('');const [campaign,setCampaign]=useState('');const [url,setUrl]=useState('');const [error,setError]=useState('');const [message,setMessage]=useState('');
 function changed(){setUrl('');setError('');setMessage('');}
 return <section className="mt-8 rounded-2xl border bg-card p-5 sm:p-7" aria-labelledby="campaign-builder-title"><h2 id="campaign-builder-title" className="text-xl font-semibold">Create a trackable campaign link</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Use a separate campaign label for each promotion so visits appear clearly in the Campaigns report. Labels are standardized to lowercase with underscores for spaces. Do not include personal or animal details.</p>
 <form className="mt-5 space-y-5" noValidate onSubmit={event=>{event.preventDefault();setMessage('');try{setUrl(campaignLink(destination,source,medium,campaign));setError('');}catch(cause){setUrl('');setError((cause as Error).message);}}}>
  <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="campaign-destination">Destination</Label><select id="campaign-destination" className="w-full rounded-xl border bg-background p-3" value={destination} onChange={event=>{changed();setDestination(event.target.value);}}>{campaignDestinations.map(([path,label])=><option key={path} value={path}>{label}</option>)}</select></div>
  {([['source','Source',source,setSource,'facebook'],['medium','Medium',medium,setMedium,'social'],['name','Campaign',campaign,setCampaign,'november_launch']] as const).map(([id,label,value,setter,placeholder])=><div key={id} className="space-y-2"><Label htmlFor={`campaign-${id}`}>{label}</Label><Input id={`campaign-${id}`} maxLength={64} value={value} placeholder={placeholder} onChange={event=>{changed();setter(event.target.value);}}/></div>)}</div>
  <Button type="submit">Build campaign link</Button>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </form>
 {url&&<div className="mt-5 space-y-3"><Label htmlFor="campaign-result">Generated campaign link</Label><textarea id="campaign-result" readOnly value={url} className="w-full min-h-28 rounded-xl border bg-background p-3 text-sm break-all"/><Button variant="outline" onClick={()=>{if(!navigator.clipboard){setMessage('Select and copy the generated link above.');return;}void navigator.clipboard.writeText(url).then(()=>setMessage('Campaign link copied.'),()=>setMessage('Copy failed. Select and copy the generated link above.'));}}>Copy campaign link</Button></div>}
 {message&&<p role="status" className="mt-3 text-sm">{message}</p>}<p className="mt-4 text-xs leading-relaxed text-muted-foreground">Visits appear only after analytics is activated in Vercel. Session attribution uses its first campaign; test new campaigns in a signed-out fresh/incognito session. Creating a link does not publish or send it.</p></section>;
}
