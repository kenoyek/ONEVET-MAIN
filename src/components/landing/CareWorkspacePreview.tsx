import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight, PawPrint, Sprout, CalendarDays, NotebookPen, Check} from 'lucide-react';

export function CareWorkspacePreview(){
 const [farm,setFarm]=useState(false);
 return <section className="welcome-confidence" aria-labelledby="home-confidence-heading"><div className="container-wide welcome-workspace-grid">
  <div><p className="welcome-kicker">A free account. A clearer picture.</p><h2 id="home-confidence-heading">Their care story.<br/><em>All in your corner.</em></h2><p className="welcome-workspace-intro">From a new pet’s first profile to the animals behind your livelihood. Give their details a home you can return to.</p>
   <ul className="welcome-workspace-benefits">{['Animal profiles and owner-reported observations','Appointment requests and provider conversations','A workspace for pets, farm animals or both'].map(text=><li key={text}><Check size={17} aria-hidden="true"/>{text}</li>)}</ul>
   <Link className="welcome-button welcome-button-primary" to="/auth?mode=signup">Create your free account <span><ArrowUpRight size={19} aria-hidden="true"/></span></Link>
   <p className="welcome-workspace-note">Account creation is free. Provider services have their own fees and require confirmation.</p>
  </div>
  <div className="welcome-workspace-preview"><div className="welcome-workspace-preview-top"><span className="welcome-kicker">Inside your care workspace</span><span className="welcome-preview-label">Feature preview</span></div>
   <div className="welcome-workspace-switch" role="group" aria-label="Preview your care workspace"><button type="button" aria-pressed={!farm} onClick={()=>setFarm(false)}><PawPrint size={16} aria-hidden="true"/>Pets</button><button type="button" aria-pressed={farm} onClick={()=>setFarm(true)}><Sprout size={16} aria-hidden="true"/>Farm animals</button></div>
   <div aria-live="polite" className="welcome-workspace-features">
    <div><span>{farm?<Sprout size={22} aria-hidden="true"/>:<PawPrint size={22} aria-hidden="true"/>}</span><div><h3>{farm?'Your farm & animal groups':'Your pet profiles'}</h3><p>{farm?'Keep herds, flocks, ponds and batches together.':'Save species, age, photos and the details that matter.'}</p></div></div>
    <div><span><CalendarDays size={22} aria-hidden="true"/></span><div><h3>Appointment requests</h3><p>{farm?'Choose an eligible animal group when requesting veterinary or diagnostic care.':'Choose a service, select your animal and request a time.'}</p></div></div>
    <div><span><NotebookPen size={22} aria-hidden="true"/></span><div><h3>{farm?'Group observations':'Their health journal'}</h3><p>{farm?'Record changes you notice and share context with your vet.':'Keep owner observations and dates in one place for each pet.'}</p></div></div>
   </div><p className="welcome-preview-footnote">A guide to available features. Your records appear after you add them.</p>
  </div>
 </div></section>;
}
