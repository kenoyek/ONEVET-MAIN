import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight,MapPin,Phone,MessageCircle,TriangleAlert,Check} from 'lucide-react';
import {Navbar} from '@/components/layout/Navbar';
import {Footer} from '@/components/layout/Footer';
import {SEO} from '@/components/shared/SEO';
import {Button} from '@/components/ui/button';
import './urgent-care.css';

export default function UrgentCare(){
 const [city,setCity]=useState('');
 const query='veterinary clinic '+(city.trim().slice(0,80)||'near me');
 return <div className="urgent-care-page min-h-screen bg-background"><SEO title="Urgent care guidance" description="If your animal is in immediate distress, seek an in-person veterinarian. Find clinic search options and understand the limits of online support."/><Navbar/><main id="main-content" tabIndex={-1} className="container-wide pt-28 md:pt-36 pb-20">
  <header className="urgent-care-header"><p className="eyebrow">Urgent care guidance</p><h1>When care<br/><em>cannot wait.</em></h1><p>If your animal is in immediate distress, contact or visit an in-person veterinarian. Do not wait for an online reply or appointment confirmation.</p></header>
  <section className="urgent-care-notice" aria-label="Emergency service limits"><TriangleAlert size={24} aria-hidden="true"/><p>1Vet is not an emergency clinic or dispatch service. We do not guarantee immediate responses or round-the-clock provider availability.</p></section>
  <div className="urgent-care-grid"><section className="urgent-clinic-search" aria-labelledby="urgent-clinic-heading"><MapPin size={29} strokeWidth={1.5} aria-hidden="true"/><h2 id="urgent-clinic-heading">Find an in-person clinic</h2><p>Search for veterinary clinics in your city or look nearby on Google Maps. Call the clinic to check whether it is open, can treat your animal and can receive an urgent visit.</p>
   <form action="https://www.google.com/maps/search/" method="get" target="_blank" rel="noopener noreferrer"><input type="hidden" name="api" value="1"/><input type="hidden" name="query" value={query}/><label htmlFor="urgent-city">City or area <span>(optional)</span></label><input id="urgent-city" autoComplete="address-level2" maxLength={80} placeholder="e.g. Ibadan, Oyo State" value={city} onChange={event=>setCity(event.target.value)}/><Button type="submit">Search veterinary clinics<ArrowUpRight size={17} aria-hidden="true"/></Button></form>
   <p className="urgent-external-note">Opens Google Maps in a new tab. Map listings do not confirm emergency capacity or current opening hours.</p>
  </section><section className="urgent-call-guide" aria-labelledby="urgent-call-heading"><Phone size={29} strokeWidth={1.5} aria-hidden="true"/><h2 id="urgent-call-heading">Tell the clinic what’s happening</h2><p>A short, clear description helps the clinic advise you on the next step.</p><ul>{['Your animal’s species and approximate age','What you have noticed and when it started','Your location and whether you can travel','Any known conditions, medicines or recent treatment'].map(text=><li key={text}><Check size={17} aria-hidden="true"/>{text}</li>)}</ul><p className="urgent-clinician-note">Follow the veterinarian’s instructions. Online information does not replace an examination or emergency treatment.</p></section></div>
  <section className="urgent-support" aria-labelledby="urgent-support-heading"><MessageCircle size={26} strokeWidth={1.5} aria-hidden="true"/><div><p className="eyebrow">For platform questions only</p><h2 id="urgent-support-heading">Need help with your account?</h2><p>Our support team can help with account access and platform questions. The support line and contact form are not emergency veterinary services.</p></div><Button asChild variant="outline"><Link to="/contact">Contact platform support<ArrowUpRight size={17} aria-hidden="true"/></Link></Button></section>
  <section className="urgent-routine" aria-labelledby="urgent-routine-heading"><h2 id="urgent-routine-heading">Looking for routine care instead?</h2><p>Explore listed services and request an appointment for concerns that can wait for provider confirmation.</p><div className="flex flex-wrap gap-3 mt-5"><Button asChild variant="outline"><Link to="/find-a-vet">Browse veterinary services</Link></Button><Button asChild variant="ghost"><Link to="/my-bookings">Your appointment requests</Link></Button></div></section>
 </main><Footer/></div>;
}
