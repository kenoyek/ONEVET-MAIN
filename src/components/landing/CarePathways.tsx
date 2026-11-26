import { Link } from 'react-router-dom';
import { ArrowUpRight, House, Search, CalendarPlus, CalendarCheck, TriangleAlert, Plus } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import farmImage from '@/assets/marketing/welcome-farm-760.webp';
import petImage from '@/assets/marketing/welcome-pets-760.webp';

const steps = [
  { icon: Search, title: 'Choose a provider', text: 'Browse services and compare provider expertise, location, and listed fees.' },
  { icon: CalendarPlus, title: 'Request a visit', text: 'Sign in, select your animal and an available time, and tell the provider what you need.' },
  { icon: CalendarCheck, title: 'Wait for confirmation', text: 'Your request stays pending until the provider confirms. Check My bookings for updates and messages.' },
];
const questions = [
  ['How do I speak to a veterinarian?', 'Browse veterinary services, review a provider’s profile and fees, then sign in to request care. Availability must be confirmed by the provider; a listing does not guarantee an immediate response.'],
  ['Can I get help with livestock?', 'You can seek veterinary guidance for farm animals as well as pets. Confirm the provider’s species expertise before booking. Farm records support animal groups and owner observations. Eligible veterinary and diagnostic appointment requests can use an active farm group. The provider must confirm the request.'],
  ['What does an online consultation include?', 'A remote conversation can help you explain a concern and discuss next steps. A veterinarian may recommend an examination, testing, or treatment in person. Audio and video availability must be confirmed with the provider.'],
  ['What if my animal needs urgent care?', 'If your animal may need emergency treatment, seek an in-person veterinarian immediately. Do not wait for a reply online. 1Vet does not guarantee emergency dispatch or round-the-clock provider availability.'],
];

export function CarePathways() {
  return <>
    <section id="care-pathways" className="container-wide welcome-section welcome-pathways" aria-labelledby="pathways-heading">
      <div className="welcome-section-heading">
        <h2 id="pathways-heading">Care for life at home <em>and on the farm.</em></h2>
      </div>
      <div className="welcome-path-grid">
        <Link to="/pet-care" className="welcome-path-card" aria-labelledby="pet-path-title">
          <div className="welcome-path-image">
            <img src={petImage} alt="" loading="lazy" decoding="async" width="760" height="570" />
          </div>
          <div className="welcome-path-copy">
            <div>
              <h3 id="pet-path-title">Pet care</h3>
              <p>Find help for everyday concerns and keep your pet’s health records together.</p>
            </div>
            <span className="welcome-arrow-circle"><ArrowUpRight size={22} aria-hidden="true" /></span>
          </div>
        </Link>
        <Link to="/farm-care" className="welcome-path-card" aria-labelledby="farm-path-title">
          <div className="welcome-path-image">
            <img src={farmImage} alt="" loading="lazy" decoding="async" width="760" height="570" />
          </div>
          <div className="welcome-path-copy">
            <div>
              <h3 id="farm-path-title">Farm &amp; livestock care</h3>
              <p>Find veterinary guidance for farm animals and manage herd, flock, or pond records.</p>
            </div>
            <span className="welcome-arrow-circle"><ArrowUpRight size={22} aria-hidden="true" /></span>
          </div>
        </Link>
        <Link to="/boarding" className="welcome-path-card welcome-path-boarding" aria-labelledby="boarding-path-title">
          <span className="welcome-arrow-circle"><House size={22} aria-hidden="true" /></span>
          <div className="welcome-path-copy">
            <div>
              <h3 id="boarding-path-title">Pet boarding</h3>
              <p>Browse approved facilities and ask about stays, rates, and requirements.</p>
            </div>
            <span className="welcome-arrow-circle"><ArrowUpRight size={22} aria-hidden="true" /></span>
          </div>
        </Link>
      </div>
    </section>
    <section className="welcome-steps" aria-labelledby="steps-heading">
      <div className="container-wide">
        <div className="welcome-section-heading">
          <h2 id="steps-heading">How to request <em>an appointment</em></h2>
        </div>
        <ol className="welcome-steps-grid" role="list">
          {steps.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="welcome-step-icon"><Icon size={23} strokeWidth={1.6} aria-hidden="true" /></span>
              <div><h3>{title}</h3><p>{text}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
    <section className="container-wide welcome-section welcome-faq" aria-labelledby="welcome-faq-heading"><div><p className="welcome-kicker">A little reassurance</p><h2 id="welcome-faq-heading">Good questions.<br /><em>Clearer answers.</em></h2><p className="welcome-section-description">Know what to expect, so you can choose your next step with confidence.</p><Link className="welcome-text-link" to="/pricing">Review pricing and plans <ArrowUpRight size={17} aria-hidden="true" /></Link></div><Accordion type="single" collapsible className="welcome-accordion">{questions.map(([q,a])=><AccordionItem value={q!} key={q}><AccordionTrigger className="text-left gap-4 py-6 text-base">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground leading-relaxed pb-6">{a}</AccordionContent></AccordionItem>)}</Accordion></section>
    <section className="container-wide welcome-urgent"><div><TriangleAlert size={22} strokeWidth={1.6} aria-hidden="true" /><div><h2>An emergency needs in-person care.</h2><p>If your animal is in immediate distress, contact a nearby veterinary clinic. Don’t wait for an online reply.</p></div><Link to="/urgent-care" className="welcome-text-link">Urgent care guidance <ArrowUpRight size={17} aria-hidden="true" /></Link></div></section>
    <section className="container-wide welcome-professionals" aria-labelledby="professional-heading"><div><div><p className="welcome-kicker"><Plus size={15} aria-hidden="true" /> For veterinary professionals</p><h2 id="professional-heading">Your expertise.<br /><em>A little more reach.</em></h2><p>Connect with animal owners and bring your care to more lives. Start a provider application for review.</p></div><Link className="welcome-button welcome-button-primary" to="/auth?mode=signup&role=veterinarian">Apply to join 1Vet <span><ArrowUpRight size={19} aria-hidden="true" /></span></Link></div></section>
  </>;
}
