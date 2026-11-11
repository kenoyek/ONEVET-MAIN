import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function AccountNextSteps({ hasAnimals }: { hasAnimals?: boolean }) {
  const { profile, role, user } = useAuth();
  const provider = role === 'service_provider';
  const farm = profile?.customer_type === 'farm_owner' || profile?.customer_type === 'livestock_owner';
  const records = useQuery({
    queryKey: ['onboarding-record-count', user?.id, profile?.id, provider ? 'business' : 'farm'],
    enabled: !!user?.id && profile?.user_id === user.id && (provider || farm || profile?.customer_type === 'both'),
    queryFn: async () => {
      const result = provider
        ? await supabase.from('provider_organizations').select('id', { count: 'exact', head: true }).eq('created_by', user!.id)
        : await supabase.from('livestock_farms').select('id', { count: 'exact', head: true }).eq('owner_id', profile!.id);
      if (result.error) throw result.error;
      return result.count || 0;
    },
  });
  if (!profile) return null;
  const contactComplete = !!profile.first_name?.trim() && !!profile.last_name?.trim() && !!profile.phone?.trim();
  const steps = [
    { title: 'Complete your contact details', description: 'Keep your name, phone and location ready for service requests.', href: '/profile', done: contactComplete },
    provider ? { title: 'Register your organization', description: 'Save your business, attach documents and submit it for review.', href: '/provider/register', done: !!records.data }
      : { title: farm ? 'Add your farm and animals' : 'Add an animal profile', description: farm ? 'Create farm records and animal groups before requesting care.' : 'Keep your animal’s details ready when booking a service.', href: farm ? '/farms' : '/pets/new', done: farm ? !!records.data : !!hasAnimals || (profile.customer_type === 'both' && !!records.data) },
    { title: provider ? 'Manage your workspaces' : 'Find the right care', description: provider ? 'Open saved organizations and invitations to see their next steps. Approval is required before services can be published.' : 'Browse providers and check availability before requesting a booking.', href: provider ? '/provider/invitations' : '/find-a-vet', done: false },
  ];
  return <section className="mb-8 rounded-2xl border bg-card p-6 sm:p-8" aria-label="Getting started">
    <p className="eyebrow mb-2">Getting started</p><h2 className="text-2xl mb-5">{provider ? 'Set up your business on 1Vet' : 'Your first steps on 1Vet'}</h2>
    <div className="grid gap-4 md:grid-cols-3">{steps.map((step, index) => <Link key={step.href} to={step.href} className="rounded-xl border border-border p-4 hover:border-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
      <span className="mb-3 flex items-center gap-2 text-xs text-primary font-semibold">{step.done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : `${index + 1}.`}{step.done ? 'Added' : 'Next step'}</span>
      <h3 className="font-semibold mb-2">{step.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p><ArrowUpRight className="mt-4 h-4 w-4 text-primary" aria-hidden="true" />
    </Link>)}</div>
  </section>;
}
