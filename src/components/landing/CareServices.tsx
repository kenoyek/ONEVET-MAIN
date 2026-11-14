import {Link} from 'react-router-dom';
import {ArrowUpRight, Stethoscope, Scissors, Sprout, HeartHandshake, Check} from 'lucide-react';
import clinic from '@/assets/marketing/clinic-cat-exam-card.webp';
import grooming from '@/assets/marketing/pet-grooming-card.webp';
import livestock from '@/assets/marketing/livestock-care-card.webp';

const services = [
  {title:'Veterinary care',description:'A new concern or a routine check. Find a veterinarian and explore the care available.',href:'/find-a-vet',image:clinic,Icon:Stethoscope},
  {title:'Grooming & wellbeing',description:'Everyday comfort, from coat care to a little extra attention. Meet service providers.',href:'/provider-marketplace',image:grooming,Icon:Scissors},
  {title:'Farm & livestock care',description:'Support for your herd, flock or pond. Keep group records and find the right expertise.',href:'/farm-care',image:livestock,Icon:Sprout},
];
export function CareServices(){
 return <>
  <section className="container-wide welcome-section welcome-services" aria-labelledby="home-services-heading">
   <div className="welcome-section-heading"><div><p className="welcome-kicker">One place. More ways to care.</p><h2 id="home-services-heading">Good care starts<br/><em>with the right connection.</em></h2></div><Link className="welcome-text-link" to="/provider-marketplace">Explore all care services <ArrowUpRight size={17} aria-hidden="true"/></Link></div>
   <div className="welcome-services-grid">{services.map(({title,description,href,image,Icon})=><Link key={title} to={href} className="welcome-service-card"><div className="welcome-service-image"><img src={image} alt="" width="768" height="512" loading="lazy" decoding="async"/><span><Icon size={21} aria-hidden="true"/></span></div><div className="welcome-service-body"><h3>{title}</h3><p>{description}</p><span className="welcome-service-action">Discover more <ArrowUpRight size={17} aria-hidden="true"/></span></div></Link>)}</div>
  </section>
  <section className="welcome-confidence" aria-labelledby="home-confidence-heading"><div className="container-wide welcome-confidence-grid"><div><p className="welcome-kicker">Built around your peace of mind</p><h2 id="home-confidence-heading">Less guesswork.<br/><em>More confidence.</em></h2><p>Know where to start, what you’re requesting and where to return. Care feels simpler when the next step is clear.</p><Link className="welcome-button welcome-button-primary" to="/auth?mode=signup">Create your free account <span><ArrowUpRight size={19} aria-hidden="true"/></span></Link></div><div className="welcome-confidence-list">{[
   ['Choose with context','Review provider profiles, services and listed fees before requesting care.'],
   ['Stay in the loop','Follow appointment requests and conversations from your own care workspace.'],
   ['Build their health story','Keep pet profiles, farm groups and owner-reported observations together.'],
  ].map(([title,text])=><div key={title}><span><Check size={19} aria-hidden="true"/></span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div></div></section>
  <section className="container-wide welcome-fees" aria-labelledby="home-fees-heading"><div><HeartHandshake size={30} strokeWidth={1.4} aria-hidden="true"/><div><p className="welcome-kicker">Care that fits your needs</p><h2 id="home-fees-heading">Start with clarity on costs.</h2><p>Explore listed service fees and review plan information. Confirm inclusions and availability before committing. Online payments are currently unavailable.</p></div><Link to="/pricing" className="welcome-text-link">Explore pricing & plans <ArrowUpRight size={17} aria-hidden="true"/></Link></div></section>
 </>;
}
