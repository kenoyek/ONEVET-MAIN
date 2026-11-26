import { Link } from 'react-router-dom';
import { ArrowUpRight, HeartHandshake } from 'lucide-react';
import { CareWorkspacePreview } from './CareWorkspacePreview';
import clinic from '@/assets/marketing/clinic-cat-exam-card.webp';
import grooming from '@/assets/marketing/pet-grooming-card.webp';
import livestock from '@/assets/marketing/livestock-care-card.webp';

const services = [
  { title: 'Grooming & wellbeing', description: 'Find grooming services and ask about coat care and handling.', href: '/provider-marketplace?category=grooming', image: grooming, action: 'Explore grooming' },
  { title: 'Farm & livestock care', description: 'Find veterinary guidance for your herd, flock, or pond.', href: '/farm-care', image: livestock, action: 'Explore farm care' },
];

export function CareServices() {
  return (
    <>
      <section className="container-wide welcome-section welcome-services" aria-labelledby="home-services-heading">
        <div className="welcome-section-heading">
          <h2 id="home-services-heading">Explore care services</h2>
          <Link className="welcome-text-link" to="/provider-marketplace">
            Browse all providers <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="welcome-services-grid">
          <Link to="/find-a-vet" className="welcome-service-card welcome-service-feature">
            <div className="welcome-service-body">
              <h3>Veterinary care</h3>
              <p>From routine check-ups to new concerns, browse veterinarians by location and explore their services before requesting a visit.</p>
              <span className="welcome-service-action">Browse veterinary services <ArrowUpRight size={17} aria-hidden="true" /></span>
            </div>
            <div className="welcome-service-image">
              <img src={clinic} alt="" width="768" height="512" loading="lazy" decoding="async" />
            </div>
          </Link>
          {services.map(({ title, description, href, image, action }) => (
            <Link key={title} to={href} className="welcome-service-card">
              <div className="welcome-service-image"><img src={image} alt="" width="768" height="512" loading="lazy" decoding="async" /></div>
              <div className="welcome-service-body">
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="welcome-service-action">{action} <ArrowUpRight size={17} aria-hidden="true" /></span>
              </div>
            </Link>
          ))}
        </div>
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
