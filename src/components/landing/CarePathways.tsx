import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  PawPrint,
  Sprout,
  FileText,
  Search,
  MessageCircle,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import farmImage from '@/assets/marketing/livestock-care.jpg';

export function CarePathways() {
  return (
    <>
      <section
        className="container-wide py-14 md:py-20"
        aria-labelledby="pathways-heading"
      >
        <div className="flex flex-wrap gap-4 justify-between items-end mb-8">
          <div>
            <p className="eyebrow mb-3">Different animals. The same care.</p>
            <h2 id="pathways-heading" className="text-3xl md:text-4xl">
              A place for every kind of owner.
            </h2>
          </div>
          <Link
            to="/services"
            className="text-sm font-semibold text-primary underline underline-offset-4"
          >
            Explore care options
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <Link to="/pet-care" className="care-path group">
            <PawPrint className="h-9 w-9 text-primary mb-8" />
            <p className="eyebrow mb-2">For pet owners</p>
            <h3 className="text-3xl mb-4">Better care for every paw.</h3>
            <p className="text-muted-foreground max-w-sm leading-relaxed">
              From a new concern to everyday wellbeing. Explore consultations,
              pet profiles, and your animal’s health history.
            </p>
            <span className="mt-7 inline-flex items-center gap-3 font-semibold text-primary">
              Explore pet care <ArrowUpRight size={19} />
            </span>
          </Link>
          <Link
            to="/farm-care"
            className="care-path group relative overflow-hidden"
          >
            <img
              src={farmImage}
              alt=""
              loading="lazy"
              width="1024"
              height="1024"
              className="absolute right-0 top-0 w-1/3 h-full object-cover opacity-20 pointer-events-none"
            />
            <div className="relative">
              <Sprout className="h-9 w-9 text-primary mb-8" />
              <p className="eyebrow mb-2">For livestock farmers</p>
              <h3 className="text-3xl mb-4 max-w-sm">
                Healthy animals.
                <br />
                Stronger livelihoods.
              </h3>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                Seek veterinary guidance for poultry, cattle, goats, sheep,
                pigs, and aquaculture. Start with the needs of your farm.
              </p>
              <span className="mt-7 inline-flex items-center gap-3 font-semibold text-primary">
                Explore farm care <ArrowUpRight size={19} />
              </span>
            </div>
          </Link>
        </div>
      </section>
      <section
        className="bg-card border-y py-16 md:py-20"
        aria-labelledby="steps-heading"
      >
        <div className="container-wide">
          <p className="eyebrow mb-3">Your next step, made simpler</p>
          <h2 id="steps-heading" className="text-3xl md:text-4xl mb-10">
            From a concern to a plan.
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 md:gap-14">
            {[
              {
                icon: Search,
                title: 'Find the right service',
                text: 'Explore providers, care options, and listed fees. Check suitability and availability before booking.',
              },
              {
                icon: MessageCircle,
                title: 'Share what’s happening',
                text: 'Create an account and describe your animal’s concern. Give your veterinarian the context they need.',
              },
              {
                icon: FileText,
                title: 'Keep care connected',
                text: 'Return to your consultations and pet profiles. Follow your veterinarian’s advice on next steps and in-person care.',
              },
            ].map(({ icon: Icon, title, text }, i) => (
              <div key={title}>
                <div className="flex justify-between border-t pt-5 mb-6">
                  <Icon className="text-primary" size={25} />
                  <span className="text-muted-foreground text-sm">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-lg mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container-wide py-16 md:py-20">
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-10 md:gap-20">
          <div>
            <p className="eyebrow mb-3">Clarity before you connect</p>
            <h2 className="text-3xl md:text-4xl">
              Care begins
              <br />
              with confidence.
            </h2>
            <p className="text-muted-foreground mt-5 leading-relaxed">
              Know what to expect before taking the next step. No promises of
              instant availability or one-size-fits-all care.
            </p>
            <Button variant="outline" asChild className="mt-6">
              <Link to="/pricing">
                View consultation pricing{' '}
                <ArrowUpRight size={16} className="ml-2" />
              </Link>
            </Button>
          </div>
          <Accordion type="single" collapsible>
            {[
              [
                'How do I speak to a veterinarian?',
                'Browse veterinary services, review a provider’s profile and fees, then sign in to request care. Availability must be confirmed by the provider; a listing does not guarantee an immediate response.',
              ],
              [
                'Can I get help with livestock?',
                'You can seek veterinary guidance for farm animals as well as pets. Confirm the provider’s species expertise before booking. Farm dashboards and herd or flock booking are planned improvements, not currently offered as a complete workflow.',
              ],
              [
                'What does an online consultation include?',
                'A remote conversation can help you explain a concern and discuss next steps. A veterinarian may recommend an examination, testing, or treatment in person. Audio and video availability must be confirmed with the provider.',
              ],
              [
                'What if my animal needs urgent care?',
                'If your animal may need emergency treatment, seek an in-person veterinarian immediately. Do not wait for a reply online. 1Vet does not guarantee emergency dispatch or round-the-clock provider availability.',
              ],
            ].map(([q, a]) => (
              <AccordionItem value={q!} key={q}>
                <AccordionTrigger className="text-left py-5">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
      <section className="container-wide pb-16">
        <div className="rounded-2xl bg-muted border p-6 md:p-8 flex gap-4 items-start">
          <TriangleAlert className="text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-lg mb-2">An emergency needs in-person care.</h2>
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              If your animal is in immediate distress, contact or visit a nearby
              veterinary clinic. Online advice cannot replace emergency
              treatment or a physical examination.
            </p>
            <Link
              className="inline-block mt-3 text-sm font-semibold underline underline-offset-4"
              to="/urgent-care"
            >
              Understand your next steps
            </Link>
          </div>
        </div>
      </section>
      <section className="bg-primary text-primary-foreground py-16 md:py-20">
        <div className="container-wide flex flex-col md:flex-row gap-8 md:items-center justify-between">
          <div>
            <p className="text-sm opacity-80 mb-3">
              For veterinary professionals
            </p>
            <h2 className="text-3xl md:text-4xl max-w-xl">
              Bring your expertise.
              <br />
              Help care reach further.
            </h2>
            <p className="opacity-80 mt-4 max-w-lg">
              Start a provider application and submit your professional details
              for review.
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="bg-card text-foreground hover:bg-muted shrink-0"
          >
            <Link to="/provider/register">
              Apply to join 1Vet <ArrowUpRight size={18} className="ml-3" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
