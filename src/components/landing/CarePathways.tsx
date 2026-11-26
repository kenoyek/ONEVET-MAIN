import { Link } from 'react-router-dom';
import { ArrowUpRight, House, Search, CalendarPlus, CalendarCheck, TriangleAlert, Stethoscope, Building2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import farmImage from '@/assets/marketing/welcome-farm-760.webp';
import petImage from '@/assets/marketing/welcome-pets-760.webp';

const steps = [
  { icon: Search, title: 'Choose a provider', text: 'Browse services and compare provider expertise, location, and listed fees.' },
  { icon: CalendarPlus, title: 'Request a visit', text: 'Sign in, select your animal and an available time, and tell the provider what you need.' },
  { icon: CalendarCheck, title: 'Wait for confirmation', text: 'Your request stays pending until the provider confirms. Check My bookings for updates and messages.' },
];
const questions = [
  { id: 'appointments', question: 'How do I request a veterinary appointment?',
    answer: 'Choose a service and provider, then sign in to request a time. Your request stays pending until the provider confirms it.',
    href: '/find-a-vet', action: 'Find a veterinarian' },
  { id: 'costs', question: 'How do I check fees?',
    answer: 'Check the listed fee and ask the provider what it includes. Confirm any extra charges for travel, tests, or medicines before the visit.',
    href: '/pricing', action: 'Explore pricing and plans' },
  { id: 'boarding', question: 'How do I arrange pet boarding?',
    answer: 'Search the boarding directory by city or state. Contact the facility directly to confirm dates, rates, and what your pet needs to bring.',
    href: '/boarding', action: 'Browse boarding facilities' },
  { id: 'livestock', question: 'Can I get help with livestock?',
    answer: 'You can browse veterinary services for farm animals and keep herd or flock records in your account. Check that the provider works with your species.',
    href: '/farm-care', action: 'Explore farm and livestock care' },
  { id: 'remote', question: 'What can a remote consultation help with?',
    answer: 'A remote consultation can help you describe a concern and discuss next steps. Confirm remote availability with the provider. A veterinarian may recommend an in-person examination.',
    href: '/services', action: 'Explore care services' },
  { id: 'urgent', question: 'What if my animal needs urgent care?',
    answer: 'If your animal is in immediate distress, contact a nearby veterinary clinic right away. Go to a clinic for an in-person assessment.',
    href: '/urgent-care', action: 'Read urgent care guidance' },
];

export function CarePathways() {
  return (
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
  );
}

export function CareGuidance() {
  return <>
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
    <section className="container-wide welcome-section welcome-faq" aria-labelledby="welcome-faq-heading">
      <div>
        <h2 id="welcome-faq-heading">Frequently asked <em>questions</em></h2>
        <Link className="welcome-text-link" to="/contact">
          Contact support <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <Accordion type="single" collapsible className="welcome-accordion">
        {questions.map(({ id, question, answer, href, action }) => (
          <AccordionItem value={id} key={id}>
            <AccordionTrigger className="gap-4 py-5 text-left text-base">{question}</AccordionTrigger>
            <AccordionContent className="pb-4">
              <p className="text-muted-foreground leading-relaxed">{answer}</p>
              <Link className="welcome-text-link mt-1" to={href}>
                {action} <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
    <section className="container-wide welcome-urgent"><div><TriangleAlert size={22} strokeWidth={1.6} aria-hidden="true" /><div><h2>An emergency needs in-person care.</h2><p>If your animal is in immediate distress, contact a nearby veterinary clinic. Don’t wait for an online reply.</p></div><Link to="/urgent-care" className="welcome-text-link">Urgent care guidance <ArrowUpRight size={17} aria-hidden="true" /></Link></div></section>
    <section className="container-wide welcome-professionals" aria-labelledby="professional-heading">
      <div className="welcome-professionals-panel">
        <h2 id="professional-heading">Provide care through 1Vet</h2>
        <div className="welcome-professionals-grid">
          <Link to="/auth?mode=signup&role=veterinarian" className="welcome-professional-path">
            <Stethoscope size={24} strokeWidth={1.6} aria-hidden="true" />
            <div><h3>Join as a veterinarian</h3><p>Create an account and submit your veterinary licence for review.</p></div>
            <ArrowUpRight size={19} aria-hidden="true" />
          </Link>
          <Link to="/provider/register" className="welcome-professional-path">
            <Building2 size={24} strokeWidth={1.6} aria-hidden="true" />
            <div><h3>Register a care business</h3><p>Apply to list a clinic, grooming business, boarding facility, or other care service.</p></div>
            <ArrowUpRight size={19} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  </>;
}
