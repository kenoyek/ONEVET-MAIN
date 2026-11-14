import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, PawPrint, Sprout, Stethoscope } from 'lucide-react';
import careImage from '@/assets/marketing/welcome-care-1100.webp';
import smallCareImage from '@/assets/marketing/welcome-care-640.webp';

export function Hero() {
  return (
    <section className="welcome-hero" aria-labelledby="hero-heading">
      <div className="container-wide welcome-hero-grid">
        <div className="welcome-hero-copy">
          <p className="welcome-kicker"><span /> For their health. For your peace of mind.</p>
          <h1 id="hero-heading">Care for the ones<br />who make your<br /><em>world whole.</em></h1>
          <p className="welcome-intro">Veterinary care, everyday wellbeing and essentials for your pets and farm animals. Find your people. Keep their story. Take the next step with 1Vet.</p>
          <div className="welcome-hero-actions">
            <Link className="welcome-button welcome-button-primary" to="/find-a-vet">Find a veterinarian <span><ArrowUpRight size={19} aria-hidden="true" /></span></Link>
            <Link className="welcome-hero-shop" to="/marketplace">Shop pet & farm essentials <ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
          <p className="welcome-availability">Provider availability and fees are confirmed separately.</p>
          <div className="welcome-hero-footnote"><span><PawPrint size={17} aria-hidden="true" /> Pets & companions</span><span><Sprout size={17} aria-hidden="true" /> Farms & livestock</span></div>
        </div>
        <div className="welcome-hero-visual">
          <span className="welcome-orbit" aria-hidden="true"><Sprout size={30} strokeWidth={1.4} /></span>
          <div className="welcome-hero-photo">
            <img src={careImage} srcSet={`${smallCareImage} 640w, ${careImage} 1100w`} sizes="(min-width: 1024px) 46vw, (min-width: 640px) 80vw, 100vw" alt="A veterinarian gently examining a cat beside its owner" width="1100" height="825" fetchPriority="high" decoding="async" />
            <div className="welcome-photo-caption"><Heart size={17} aria-hidden="true" /><span>For the ones who depend on you.</span></div>
          </div>
          <div className="welcome-care-note"><span className="welcome-note-icon"><Stethoscope size={24} strokeWidth={1.6} aria-hidden="true" /></span><div><p>Good care starts with connection.</p><span>A concern shared. A clearer next step.</span></div><span className="welcome-note-dot" aria-hidden="true" /></div>
        </div>
      </div>
      <div className="container-wide"><div className="welcome-principles"><p>Your animal’s world.<br /><strong>Connected by care.</strong></p><div><Stethoscope size={22} strokeWidth={1.5} aria-hidden="true" /><span>Explore veterinary<br /><strong>services & providers</strong></span></div><div><PawPrint size={22} strokeWidth={1.5} aria-hidden="true" /><span>Keep your animals’<br /><strong>stories together</strong></span></div><div><Sprout size={22} strokeWidth={1.5} aria-hidden="true" /><span>Support for pets<br /><strong>and farm animals</strong></span></div></div></div>
    </section>
  );
}
