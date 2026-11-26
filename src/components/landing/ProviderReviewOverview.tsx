import { Building2, CalendarCheck, ShieldCheck } from 'lucide-react';

const reviewDetails = [
  {
    Icon: ShieldCheck,
    title: 'Veterinary licences',
    description: '1Vet reviews the licence number and document a veterinarian submits before granting professional approval.',
  },
  {
    Icon: Building2,
    title: 'Organization documents',
    description: 'Clinics and other businesses submit registration evidence for a separate review before they can publish eligible listings.',
  },
  {
    Icon: CalendarCheck,
    title: 'Visit details',
    description: 'Ask the provider about availability, fees, and whether the service fits your animal’s needs before you travel.',
  },
];

export function ProviderReviewOverview() {
  return (
    <section className="container-wide welcome-provider-review" aria-labelledby="provider-review-heading">
      <div className="welcome-provider-review-panel">
        <h2 id="provider-review-heading">What to know before you book</h2>
        <ul className="welcome-provider-review-grid" role="list">
          {reviewDetails.map(({ Icon, title, description }) => (
            <li key={title}>
              <Icon size={23} strokeWidth={1.6} aria-hidden="true" />
              <div><h3>{title}</h3><p>{description}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
