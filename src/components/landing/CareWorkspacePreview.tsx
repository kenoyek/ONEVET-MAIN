import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight, PawPrint, Sprout, CalendarDays, NotebookPen, Check} from 'lucide-react';

export function CareWorkspacePreview(){
 const [farm,setFarm]=useState(false);
 return <section className="welcome-confidence" aria-labelledby="home-confidence-heading"><div className="container-wide welcome-workspace-grid">
  <div><h2 id="home-confidence-heading">Your animals’ care,<br/><em>in one place.</em></h2><p className="welcome-workspace-intro">Keep health records and follow appointment requests from your 1Vet account.</p>
   <ul className="welcome-workspace-benefits">{['Animal profiles and owner-reported observations','Appointment requests and provider conversations','A workspace for pets, farm animals or both'].map(text=><li key={text}><Check size={17} aria-hidden="true"/>{text}</li>)}</ul>
   <Link className="welcome-button welcome-button-primary" to="/auth?mode=signup">Create your free account <span><ArrowUpRight size={19} aria-hidden="true"/></span></Link>
   <p className="welcome-workspace-note">Account creation is free. Provider services have their own fees and require confirmation.</p>
  </div>
  <div className="welcome-workspace-preview"><div className="welcome-workspace-preview-top"><strong>Care workspace</strong><span className="welcome-preview-label">Preview</span></div>
   <div className="welcome-workspace-switch" role="group" aria-label="Preview your care workspace"><button type="button" aria-pressed={!farm} onClick={()=>setFarm(false)}><PawPrint size={16} aria-hidden="true"/>Pets</button><button type="button" aria-pressed={farm} onClick={()=>setFarm(true)}><Sprout size={16} aria-hidden="true"/>Farm animals</button></div>
   <div aria-live="polite" className="welcome-workspace-features">
    <div className="welcome-workspace-example"><span><CalendarDays size={20} aria-hidden="true" /></span><div>
      <h3>{farm ? 'Herd health check' : 'Routine check-up'}</h3>
      <p>Example appointment · Awaiting provider confirmation</p>
    </div></div>
    <div><span>{farm?<Sprout size={22} aria-hidden="true"/>:<PawPrint size={22} aria-hidden="true"/>}</span><div><h3>{farm?'Your farm & animal groups':'Your pet profiles'}</h3><p>{farm?'Keep herds, flocks, ponds and batches together.':'Save species, age, photos and the details that matter.'}</p></div></div>
    <div><span><CalendarDays size={22} aria-hidden="true"/></span><div><h3>Appointment requests</h3><p>{farm?'Choose an eligible animal group when requesting veterinary or diagnostic care.':'Choose a service, select your animal and request a time.'}</p></div></div>
    <div><span><NotebookPen size={22} aria-hidden="true"/></span><div><h3>{farm?'Group observations':'Their health journal'}</h3><p>{farm?'Record changes you notice and share context with your vet.':'Keep owner observations and dates in one place for each pet.'}</p></div></div>
   </div>
  </div>
 </div></section>;
}
