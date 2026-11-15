import {Link} from 'react-router-dom';
import {ArrowUpRight,Check,ShoppingBag} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Accordion,AccordionContent,AccordionItem,AccordionTrigger} from '@/components/ui/accordion';
import {isFeatureEnabled} from '@/lib/feature-flags';
import './care-getting-started.css';

export function CareGettingStarted({farm}:{farm:boolean}){
 const farmReady=isFeatureEnabled('customer_farms_enabled');
 const farms=farmReady?'/farms':'/contact';
 const steps=farm?[
  ['Register your farm',farmReady?'Save the farm name, production type and service location.':'Contact our team about farm-record availability.',farms,farmReady?'Start your farm record':'Ask about farm records'],
  ['Organize your animal groups',farmReady?'Add a herd, flock, pond or batch and its animal count.':'Ask how group records will work for your farm.',farms,farmReady?'Open farm groups':'Contact the team'],
  ['Find the right expertise','Check species experience, listed fees and availability before requesting care.','/find-a-vet','Explore veterinary care'],
 ]:[
  ['Start with their profile','Add your pet’s name and species. A photo, breed and health context can follow.','/pets/new','Add your first pet'],
  ['Keep their story together','Record owner observations and dates in their health journal.','/pets','Open your pet profiles'],
  ['Take the next step in care','Review providers and request an appointment. Your provider must confirm it.','/find-a-vet','Explore veterinary care'],
 ];
 const preparation=farm?['Species, group size and the animals affected','When changes started and how they have progressed','Recent feed, water, housing or management changes','Relevant records and clear photos you can discuss with your vet']:["Your pet’s age, species and known health history",'When you first noticed the concern and what has changed','Current medicines, allergies and recent treatments','Relevant records and clear photos you can discuss with your vet'];
 const questions=farm?[
  ['Do I need a profile for every animal?','No. Farm records support herds, flocks, ponds and batches, so you can track groups without registering every animal individually.'],
  ['Can I request an appointment for a group?','Eligible veterinary and diagnostic services can use an active or quarantined group. The provider must confirm the request and suitability for your animals.'],
  ['Are farm observations veterinary records?','They are owner-reported observations, not a diagnosis or certified clinical record. A veterinarian should interpret concerns and recommend care.'],
 ]:[
  ['What if I do not know their birth date or breed?','Start with their name and species. Leave unknown optional details blank and update the profile when you have more information.'],
  ['Does adding a pet book a consultation?','No. A profile keeps their details together. Choose a service and submit a separate appointment request; it is pending until the provider confirms it.'],
  ['Does the health journal send reminders?','The journal stores the observations and dates you record. It does not send automatic reminders or confirm vaccination status. Discuss the schedule with your veterinarian.'],
 ];
 return <div className="care-start">
  <section className="care-start-section" aria-labelledby="care-start-heading"><div className="care-start-heading"><div><p className="eyebrow">A simpler first step</p><h2 id="care-start-heading">{farm?'From your farm':'From their first profile'}<br/><em>to a clearer care plan.</em></h2></div><p>You can browse care freely. Sign in when you’re ready to save records or request an appointment.</p></div><ol className="care-start-steps">{steps.map(([title,text,href,action],index)=><li key={title}><span className="care-start-number">0{index+1}</span><h3>{title}</h3><p>{text}</p><Link to={href!}>{action}<ArrowUpRight size={16} aria-hidden="true"/></Link></li>)}</ol></section>
  <section className="care-prepare" aria-labelledby="care-prepare-heading"><div><p className="eyebrow">Make the conversation useful</p><h2 id="care-prepare-heading">A little context.<br/><em>A better starting point.</em></h2><p>Bring what you know. These details help a veterinarian understand the concern; they do not replace an examination.</p></div><ul>{preparation.map(text=><li key={text}><Check size={18} aria-hidden="true"/>{text}</li>)}</ul></section>
  <section className="care-start-faq" aria-labelledby="care-start-faq-heading"><div><p className="eyebrow">Before you begin</p><h2 id="care-start-faq-heading">{farm?'Farm care':'Pet care'},<br/><em>made clearer.</em></h2></div><Accordion type="single" collapsible>{questions.map(([question,answer])=><AccordionItem key={question} value={question!}><AccordionTrigger className="text-left">{question}</AccordionTrigger><AccordionContent className="leading-relaxed text-muted-foreground">{answer}</AccordionContent></AccordionItem>)}</Accordion></section>
  <section className="care-start-shop" aria-labelledby="care-start-shop-heading"><ShoppingBag size={29} strokeWidth={1.5} aria-hidden="true"/><div><p className="eyebrow">Everyday essentials</p><h2 id="care-start-shop-heading">{farm?'Supplies for your farm.':'Small things. Happier routines.'}</h2><p>{farm?'Explore listed livestock supplies and build a shopping list.':'Explore pet food and everyday supplies while you browse.'} Online checkout is currently unavailable.</p></div><Button asChild variant="outline"><Link to={'/marketplace?'+new URLSearchParams({category:farm?'Livestock':'Pet Food'})}>{farm?'Browse farm supplies':'Browse pet essentials'}<ArrowUpRight size={16} aria-hidden="true"/></Link></Button></section>
 </div>;
}
