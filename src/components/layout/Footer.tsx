import { Link } from 'react-router-dom';
import { Stethoscope, ArrowUpRight } from 'lucide-react';

const groups = [
  {
    title: 'Find care',
    links: [
      ['Find a veterinarian', '/find-a-vet'],
      ['Pet care', '/pet-care'],
      ['Farm & livestock', '/farm-care'],
      ['All services', '/services'],
      ['Consultation pricing', '/pricing'],
    ],
  },
  {
    title: 'Explore 1Vet',
    links: [
      ['About us', '/about'],
      ['Resources', '/articles'],
      ['Contact & support', '/contact'],
      ['Urgent care guidance', '/urgent-care'],
      ['Join as a provider', '/provider/register'],
    ],
  },
];
export function Footer() {
  return (
    <footer className="bg-card border-t pb-8 pt-14">
      <div className="container-wide">
        <div className="grid md:grid-cols-[1.5fr_1fr_1fr] gap-10">
          <div>
            <Link
              to="/"
              aria-label="1Vet home"
              className="inline-flex gap-2 items-center font-display font-bold text-2xl text-primary"
            >
              <Stethoscope />
              1vet<span className="text-secondary">.</span>
            </Link>
            <p className="max-w-sm mt-5 text-muted-foreground leading-relaxed text-sm">
              Thoughtful care for the animals in your life. Connecting pet
              owners and farmers with veterinary services.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 mt-5 text-sm font-semibold"
            >
              Get in touch <ArrowUpRight size={16} />
            </Link>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h2 className="text-sm font-semibold mb-5">{g.title}</h2>
              <ul className="space-y-3">
                {g.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                      to={href!}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t pt-6 flex flex-col sm:flex-row gap-3 justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} 1Vet. All rights reserved.</p>
          <p>Online guidance does not replace an in-person examination.</p>
        </div>
      </div>
    </footer>
  );
}
