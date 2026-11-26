import { Link } from 'react-router-dom';
import { ArrowUpRight, FlaskConical, HeartHandshake, PawPrint, Scissors, Stethoscope } from 'lucide-react';
import { careSearchLink } from '@/lib/care-search';
import { CareWorkspacePreview } from './CareWorkspacePreview';
const services = [
  { Icon: Stethoscope, title: 'Veterinary consultations', description: 'Routine check-ups and new health concerns.', href: '/find-a-vet' },
  { Icon: Scissors, title: 'Grooming & wellbeing', description: 'Coat care and grooming services.', href: careSearchLink('grooming', '') },
  { Icon: FlaskConical, title: 'Diagnostics & labs', description: 'Laboratory tests and diagnostic services.', href: careSearchLink('diagnostics', '') },
  { Icon: PawPrint, title: 'Training & behaviour', description: 'Guidance on everyday behaviour and skills.', href: careSearchLink('training', '') },
];

export function CareServices() {
  return (
    <>
      <section className="container-wide welcome-section welcome-services" aria-labelledby="home-services-heading">
        <div className="welcome-services-intro">
          <h2 id="home-services-heading">Explore care services</h2>
          <Link className="welcome-text-link" to="/provider-marketplace">
            Browse all providers <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <ul className="welcome-service-list" aria-labelledby="home-services-heading">
          {services.map(({ Icon, title, description, href }) => (
            <li key={href}>
              <Link to={href}>
                <span className="welcome-service-icon"><Icon size={22} strokeWidth={1.6} aria-hidden="true" /></span>
                <span className="welcome-service-text"><strong>{title}</strong><span>{description}</span></span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <CareWorkspacePreview />
      <section className="container-wide welcome-fees" aria-labelledby="home-fees-heading">
        <div>
          <HeartHandshake size={30} strokeWidth={1.4} aria-hidden="true" />
          <div>
            <h2 id="home-fees-heading">Understand the costs before booking</h2>
            <p>Review listed service fees and confirm what’s included with the provider. Online payments are currently unavailable.</p>
          </div>
          <Link to="/pricing" className="welcome-text-link">
            Explore pricing &amp; plans <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
