import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import careImage from '@/assets/marketing/welcome-care-1100.webp';
import smallCareImage from '@/assets/marketing/welcome-care-640.webp';

export function Hero() {
  return (
    <section className="welcome-hero" aria-labelledby="hero-heading">
      <div className="container-wide welcome-hero-grid">
        <div className="welcome-hero-copy">
          <h1 id="hero-heading">Veterinary care for <em>pets and farm animals.</em></h1>
          <p className="welcome-intro">Find a veterinarian, explore everyday care, and keep your animals’ health records in one place.</p>
          <div className="welcome-hero-actions">
            <Link className="welcome-button welcome-button-primary" to="/find-a-vet">
              Find a veterinarian <span><ArrowUpRight size={19} aria-hidden="true" /></span>
            </Link>
          </div>
        </div>
        <div className="welcome-hero-photo">
          <img src={careImage} srcSet={`${smallCareImage} 640w, ${careImage} 1100w`}
            sizes="(min-width: 768px) 56vw, 100vw"
            alt="A veterinarian gently examining a cat beside its owner" width="1100" height="825"
            fetchPriority="high" decoding="async" />
        </div>
      </div>
    </section>
  );
}
