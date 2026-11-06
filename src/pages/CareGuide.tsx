import { isFeatureEnabled } from '@/lib/feature-flags';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  PawPrint,
  Sprout,
  Stethoscope,
  TriangleAlert,
  BookOpen,
  ClipboardList,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/shared/SEO';
import { Button } from '@/components/ui/button';

export default function CareGuide() {
  const { pathname } = useLocation();
  const farm = pathname === '/farm-care';
  const urgent = pathname === '/urgent-care';
  const services = pathname === '/services';
  const title = urgent
    ? 'When care cannot wait.'
    : services
      ? 'The next step in animal care.'
      : farm
        ? 'Protect your livestock. Protect your livelihood.'
        : 'Better care for every paw.';
  const description = urgent
    ? 'Seek an in-person veterinarian immediately if your animal is in distress. Do not wait for an online response.'
    : services
      ? 'Explore care options for your pets and livestock. Provider availability, fees, and suitability must be confirmed before booking.'
      : farm
        ? 'Professional guidance starts with understanding your farm. Look for a veterinarian with experience in your species and production system.'
        : 'Keep your pet’s details together, seek veterinary advice, and return to the conversations that matter.';
  const items = urgent
    ? [
        {
          icon: TriangleAlert,
          title: 'Seek in-person help',
          text: 'Contact or visit a nearby veterinary clinic for urgent assessment. Remote care cannot replace emergency treatment.',
          href: '/contact',
          action: 'Contact 1Vet support',
        },
        {
          icon: Stethoscope,
          title: 'Do not wait for online availability',
          text: '1Vet does not guarantee immediate responses, emergency dispatch, or continuous veterinary coverage. Contact support for platform questions only.',
          href: '/find-a-vet',
          action: 'Browse veterinary services',
        },
      ]
    : farm
      ? [
          {
            icon: Stethoscope,
            title: 'Find species-appropriate guidance',
            text: 'Browse veterinary services and confirm expertise in poultry, cattle, goats, sheep, pigs, or aquaculture with the provider.',
            href: '/find-a-vet',
            action: 'Find a veterinarian',
          },
          {
            icon: ClipboardList,
            title: 'Keep your farm records together',
            text: 'Add your farm, organize animals into flocks, herds, ponds or batches, and record health observations. Clinical advice still comes from your veterinarian.',
            href: isFeatureEnabled('customer_farms_enabled') ? '/farms' : '/contact',
            action: isFeatureEnabled('customer_farms_enabled') ? 'Open farm records' : 'Ask about farm records',
          },
          {
            icon: BookOpen,
            title: 'Explore the resource library',
            text: 'Browse published education and discuss animal-health decisions with a qualified veterinarian.',
            href: '/articles',
            action: 'Read resources',
          },
        ]
      : [
          {
            icon: Stethoscope,
            title: 'Veterinary consultations',
            text: 'Review veterinary providers and listed fees. Discuss suitability and availability before requesting care.',
            href: '/find-a-vet',
            action: 'Find a veterinarian',
          },
          {
            icon: PawPrint,
            title: services ? 'Pet care & wellbeing' : 'Your pet, in one place',
            text: services
              ? 'Explore your pet’s care journey, from profile details to consultation history.'
              : 'Add your pets and return to their profiles and consultation history from your account.',
            href: services ? '/pet-care' : '/pets',
            action: services ? 'Explore pet care' : 'Manage pet profiles',
          },
          {
            icon: Sprout,
            title: services
              ? 'Farm & livestock care'
              : 'Grooming, boarding & sitting',
            text: services
              ? 'Seek guidance for farm animals and learn what to prepare for a veterinary conversation.'
              : 'Browse provider services. Availability and service coverage depend on the individual provider.',
            href: services ? '/farm-care' : '/provider-marketplace',
            action: services ? 'Explore farm care' : 'Browse care services',
          },
          {
            icon: BookOpen,
            title: 'Animal health resources',
            text: 'Explore published articles. Education supports, and does not replace, advice from your veterinarian.',
            href: '/articles',
            action: 'Explore resources',
          },
        ];
  return (
    <div className="bg-background min-h-screen">
      <SEO
        title={
          urgent
            ? 'Urgent care guidance'
            : services
              ? 'Our services'
              : farm
                ? 'Farm & livestock care'
                : 'Pet care'
        }
        description={description}
      />
      <Navbar />
      <main id="main-content" tabIndex={-1} className="pt-32 md:pt-40 pb-20">
        <div className="container-wide">
          <p className="eyebrow mb-5">
            {urgent
              ? 'Urgent care guidance'
              : farm
                ? 'For livestock farmers'
                : services
                  ? 'Care, connected'
                  : 'For pet owners'}
          </p>
          <h1 className="text-4xl md:text-6xl max-w-3xl leading-tight">
            {title}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {description}
          </p>
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {items.map(({ icon: Icon, title: heading, text, href, action }) => (
              <article className="care-path" key={heading}>
                <Icon className="text-primary mb-6" size={30} />
                <h2 className="text-2xl mb-3">{heading}</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {text}
                </p>
                <Button asChild variant="outline">
                  <Link to={href}>
                    {action}
                    <ArrowRight size={16} className="ml-3" />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
          {!urgent && (
            <p className="mt-8 text-sm text-muted-foreground">
              Need urgent treatment?{' '}
              <Link className="underline underline-offset-4" to="/urgent-care">
                Seek in-person veterinary care.
              </Link>
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
