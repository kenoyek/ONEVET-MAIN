import careImage from '@/assets/marketing/welcome-care-1100.webp';
import { PageHeading } from '@/components/layout/PageHeading';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Sprout, Stethoscope } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/shared/SEO';

export default function About() {
  return (
    <div className="bg-background min-h-screen">
      <SEO
        title="About 1Vet"
        description="Our mission is to make veterinary guidance more accessible for pet owners and livestock farmers."
      />
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="container-wide pt-32 md:pt-40 pb-20"
      >
        <div className="public-intro public-intro-grid">
          <PageHeading size="display" eyebrow="Our purpose" title={<>Care that reaches<br/><em>beyond the clinic.</em></>} description="1Vet’s mission is to make veterinary guidance more accessible to pet owners and farmers. We’re building connections between people, animal health records, and veterinary professionals."/>
          <img className="public-intro-image" src={careImage} alt="A veterinarian examining a cat with its owner" width="1100" height="825" decoding="async"/>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            {
              icon: Heart,
              title: 'For the animals you love',
              text: 'Make it easier to seek advice and keep your pet’s health journey in view.',
            },
            {
              icon: Sprout,
              title: 'For the livelihoods you build',
              text: 'Give farm and livestock care a place alongside companion animal healthcare.',
            },
            {
              icon: Stethoscope,
              title: 'With professional judgment',
              text: 'Remote guidance supports veterinary care. Physical examination and emergency treatment remain essential when needed.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="care-path">
              <Icon className="text-primary mb-6" size={28} />
              <h2 className="text-xl mb-3">{title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {text}
              </p>
            </article>
          ))}
        </div>
        <section className="mt-14 max-w-2xl">
          <h2 className="text-3xl mb-5">
            Built around access, trust, and prevention.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Our long-term ambition is to support continuous animal care across
            Nigeria and beyond. Service coverage and provider availability vary.
            We do not present our growth targets as achieved milestones.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Button asChild>
              <Link to="/find-a-vet">
                Explore veterinary services{' '}
                <ArrowRight size={16} className="ml-3" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact">Contact the team</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
