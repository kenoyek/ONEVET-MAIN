import { Link } from 'react-router-dom';
import { ArrowUpRight, PawPrint, Sprout, Search, MessageCircle, FileText, TriangleAlert, Plus } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import farmImage from '@/assets/marketing/welcome-farm-760.webp';
import petImage from '@/assets/marketing/welcome-pets-760.webp';

const steps = [
  { icon: Search, title: 'Find your care.', text: 'Explore services and provider profiles. Check their expertise, listed fees and availability.' },
  { icon: MessageCircle, title: 'Share their story.', text: 'Sign in, describe your concern and request the care that fits your animal’s needs.' },
  { icon: FileText, title: 'Keep it connected.', text: 'Return to your appointments, conversations and animal profiles, all in your workspace.' },
];
const questions = [
  ['How do I speak to a veterinarian?', 'Browse veterinary services, review a provider’s profile and fees, then sign in to request care. Availability must be confirmed by the provider; a listing does not guarantee an immediate response.'],
  ['Can I get help with livestock?', 'You can seek veterinary guidance for farm animals as well as pets. Confirm the provider’s species expertise before booking. Farm records support animal groups and owner observations; group-targeted consultation booking is not yet available.'],
  ['What does an online consultation include?', 'A remote conversation can help you explain a concern and discuss next steps. A veterinarian may recommend an examination, testing, or treatment in person. Audio and video availability must be confirmed with the provider.'],
  ['What if my animal needs urgent care?', 'If your animal may need emergency treatment, seek an in-person veterinarian immediately. Do not wait for a reply online. 1Vet does not guarantee emergency dispatch or round-the-clock provider availability.'],
];

export function CarePathways() {
  return <>
    <section id="care-pathways" className="container-wide welcome-section welcome-pathways" aria-labelledby="pathways-heading">
      <div className="welcome-section-heading"><div><p className="welcome-kicker">Different animals. The same care.</p><h2 id="pathways-heading">Their world.<br /><em>Your kind of care.</em></h2></div><p>From a familiar face at home to a whole farm depending on you. Start with the animals in your life.</p></div>
      <div className="welcome-path-grid">
        <Link to="/pet-care" className="welcome-path-card group"><div className="welcome-path-image"><img src={petImage} alt="" loading="lazy" decoding="async" width="760" height="570" /><span className="welcome-image-label"><PawPrint size={16} aria-hidden="true" /> For pet owners</span></div><div className="welcome-path-copy"><div><h3>Better care for every paw.</h3><p>Everyday wellbeing, new concerns and a health story that stays with them.</p></div><span className="welcome-arrow-circle"><ArrowUpRight size={23} aria-hidden="true" /></span></div><span className="welcome-path-link">Explore pet care <ArrowUpRight size={16} aria-hidden="true" /></span></Link>
        <Link to="/farm-care" className="welcome-path-card group"><div className="welcome-path-image"><img src={farmImage} alt="" loading="lazy" decoding="async" width="760" height="570" /><span className="welcome-image-label"><Sprout size={16} aria-hidden="true" /> For farmers</span></div><div className="welcome-path-copy"><div><h3>Healthy animals.<br />Stronger livelihoods.</h3><p>Veterinary guidance and records for the animals your farm depends on.</p></div><span className="welcome-arrow-circle"><ArrowUpRight size={23} aria-hidden="true" /></span></div><span className="welcome-path-link">Explore farm care <ArrowUpRight size={16} aria-hidden="true" /></span></Link>
      </div>
    </section>
    <section className="welcome-steps" aria-labelledby="steps-heading"><div className="container-wide"><div className="welcome-section-heading"><div><p className="welcome-kicker">A simpler way forward</p><h2 id="steps-heading">From “what now?”<br /><em>to a next step.</em></h2></div><p>You don’t have to have all the answers.<br />Start with what you know about your animal.</p></div><ol className="welcome-steps-grid">{steps.map(({icon:Icon,title,text},i)=><li key={title}><div className="welcome-step-top"><span>0{i+1}</span><Icon size={25} strokeWidth={1.4} aria-hidden="true" /></div><h3>{title}</h3><p>{text}</p></li>)}</ol></div></section>
    <section className="container-wide welcome-section welcome-faq" aria-labelledby="welcome-faq-heading"><div><p className="welcome-kicker">A little reassurance</p><h2 id="welcome-faq-heading">Good questions.<br /><em>Clearer answers.</em></h2><p className="welcome-section-description">Know what to expect, so you can choose your next step with confidence.</p><Link className="welcome-text-link" to="/pricing">View consultation pricing <ArrowUpRight size={17} aria-hidden="true" /></Link></div><Accordion type="single" collapsible className="welcome-accordion">{questions.map(([q,a])=><AccordionItem value={q!} key={q}><AccordionTrigger className="text-left gap-4 py-6 text-base">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground leading-relaxed pb-6">{a}</AccordionContent></AccordionItem>)}</Accordion></section>
    <section className="container-wide welcome-urgent"><div><TriangleAlert size={22} strokeWidth={1.6} aria-hidden="true" /><div><h2>An emergency needs in-person care.</h2><p>If your animal is in immediate distress, contact a nearby veterinary clinic. Don’t wait for an online reply.</p></div><Link to="/urgent-care" className="welcome-text-link">Urgent care guidance <ArrowUpRight size={17} aria-hidden="true" /></Link></div></section>
    <section className="container-wide welcome-professionals" aria-labelledby="professional-heading"><div><div><p className="welcome-kicker"><Plus size={15} aria-hidden="true" /> For veterinary professionals</p><h2 id="professional-heading">Your expertise.<br /><em>A little more reach.</em></h2><p>Connect with animal owners and bring your care to more lives. Start a provider application for review.</p></div><Link className="welcome-button welcome-button-primary" to="/provider/register">Apply to join 1Vet <span><ArrowUpRight size={19} aria-hidden="true" /></span></Link></div></section>
  </>;
}
