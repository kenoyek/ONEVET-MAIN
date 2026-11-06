import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowRight,
  PawPrint,
  Sprout,
  Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import careImage from '@/assets/marketing/clinic-cat-exam.jpg';

export function Hero() {
  return (
    <section
      className="pt-28 md:pt-40 pb-12 md:pb-20"
      aria-labelledby="hero-heading"
    >
      <div className="container-wide grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
        <div>
          <p className="eyebrow mb-6">
            <span className="inline-block w-2 h-2 rounded-full bg-secondary mr-2" />{' '}
            Animal healthcare, connected
          </p>
          <h1
            id="hero-heading"
            className="text-5xl sm:text-6xl xl:text-7xl font-semibold tracking-tight leading-[1.08] max-w-2xl"
          >
            Expert veterinary care.
            <br />
            <span className="text-primary">Wherever you are.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mt-7">
            For the pets you love and the livestock you depend on. Find
            veterinary services, seek professional guidance, and take the next
            step in your animal’s care.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button size="lg" asChild>
              <Link to="/find-a-vet">
                Find a veterinarian <ArrowUpRight className="ml-3 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/services">
                Explore our services <ArrowRight className="ml-3 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Availability and fees depend on the selected provider.
          </p>
          <div className="flex flex-wrap gap-5 mt-9 pt-6 border-t text-sm font-medium">
            <span className="flex items-center gap-2">
              <PawPrint size={17} className="text-primary" /> Companion animals
            </span>
            <span className="flex items-center gap-2">
              <Sprout size={17} className="text-primary" /> Farms & livestock
            </span>
          </div>
        </div>
        <div className="relative pb-6 lg:pl-4">
          <div className="rounded-[2rem] overflow-hidden bg-muted aspect-[5/4] lg:aspect-[4/4.3]">
            <img
              src={careImage}
              alt="A cat receiving a veterinary examination"
              width="1024"
              height="1024"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative -mt-20 mx-4 sm:mx-6 p-5 rounded-2xl bg-card border shadow-soft flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Stethoscope size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Good care starts with a conversation.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Describe your concern. Explore providers.
                <br />
                Choose the care that fits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
