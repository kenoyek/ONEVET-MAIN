import { Link } from 'react-router-dom';
import { ArrowUpRight, PawPrint, Sprout, Package, HeartPulse } from 'lucide-react';

const categories = [
  { Icon: PawPrint, title: 'Food & nutrition', category: 'Pet Food' },
  { Icon: HeartPulse, title: 'Health & wellbeing', category: 'Pet Health' },
  { Icon: Sprout, title: 'Farm essentials', category: 'Livestock' },
  { Icon: Package, title: 'Everyday accessories', category: 'Accessories' },
];

export function MarketplaceWelcome() {
  return (
    <section aria-labelledby="home-marketplace-heading" className="container-wide welcome-marketplace">
      <div className="welcome-marketplace-panel">
        <div className="welcome-marketplace-heading">
          <div>
            <h2 id="home-marketplace-heading">Pet and farm essentials</h2>
            <p>Browse supplies and compare listed prices. Online checkout is currently unavailable.</p>
          </div>
          <Link to="/marketplace" className="welcome-text-link">
            Browse all products <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <ul className="welcome-shop-categories" aria-label="Shop by category">
          {categories.map(({ Icon, title, category }) => (
            <li key={category}>
              <Link to={`/marketplace?${new URLSearchParams({ category })}`}>
                <span className="welcome-shop-category-icon"><Icon size={22} strokeWidth={1.6} aria-hidden="true" /></span>
                <span className="welcome-shop-category-name">{title}</span>
                <ArrowUpRight className="welcome-shop-category-arrow" size={17} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
