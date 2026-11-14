import {useQuery} from '@tanstack/react-query';
import {supabase} from '@/integrations/supabase/client';
import {Link} from 'react-router-dom';
import {CheckCircle2, ArrowUpRight} from 'lucide-react';
import {useAuth} from '@/lib/auth-context';
import {Button} from '@/components/ui/button';
import {isFeatureEnabled} from '@/lib/feature-flags';

export function AccountNextSteps() {
  const {profile, role, user} = useAuth();
  const provider = role === 'service_provider';
  const farm = ['farm_owner', 'livestock_owner', 'both'].includes(profile?.customer_type ?? '');
  const pets = !provider && !['farm_owner', 'livestock_owner'].includes(profile?.customer_type ?? '');
  const available = !!user && profile?.user_id === user.id && profile.is_active === true;
  const records = useQuery({
    queryKey: ['onboarding-record-count', user?.id, profile?.id, provider, farm, pets],
    enabled: available,
    queryFn: async () => {
      const count = async (table: 'pets' | 'livestock_farms' | 'provider_organizations', field: 'owner_id' | 'created_by', owner: string) => {
        const result = await supabase.from(table).select('id', {count: 'exact', head: true}).eq(field, owner);
        if (result.error) throw result.error;
        if (result.count === null) throw new Error('Record count unavailable');
        return result.count;
      };
      const [animals, farms, businesses] = await Promise.all([
        pets ? count('pets', 'owner_id', profile!.id) : 0,
        !provider && farm ? count('livestock_farms', 'owner_id', profile!.id) : 0,
        provider ? count('provider_organizations', 'created_by', user!.id) : 0,
      ]);
      return {animals, farms, businesses};
    },
  });
  if (!available) return null;
  const phoneDigits = (profile.phone ?? '').replace(/\D/g, '');
  const contactComplete = !!profile.first_name?.trim() && !!profile.last_name?.trim() && phoneDigits.length >= 7 && phoneDigits.length <= 15;
  const known = records.isSuccess && !records.isError;
  const steps = [
    {title: 'Complete your contact details', description: 'Add your name and a contact phone number for care requests.', href: '/profile', done: contactComplete, known: true},
    ...(provider ? [{title: 'Register your organization', description: 'Save your business, attach documents and submit it for review.', href: '/provider/register', done: !!records.data?.businesses, known}]
      : [...(pets ? [{title: 'Add your first pet', description: 'Keep your pet’s details ready for bookings and its health journal.', href: known && records.data?.animals ? '/pets' : '/pets/new', done: !!records.data?.animals, known}] : []),
        ...(farm ? [{title: 'Add your farm', description: 'Keep your farm details and animal groups together before requesting care.', href: isFeatureEnabled('customer_farms_enabled') ? '/farms' : '/farm-care', done: !!records.data?.farms, known}] : [])]),
  ];
  const completed = steps.filter(step => step.known && step.done).length;
  return <section className="mb-8 rounded-2xl border bg-card p-6 sm:p-8" aria-label="Getting started">
    <p className="eyebrow mb-2">Getting started</p>
    <h2 className="text-2xl">{provider ? 'Set up your business on 1Vet' : 'Make yourself at home on 1Vet'}</h2>
    <p className="mt-3 text-sm text-muted-foreground">{provider ? 'Registration is the first step. Approval is required before publishing services.' : 'Start with what you need today. You can browse care and shop while setting up your records.'}</p>
    <p role="status" className="mt-4 text-sm font-medium">{known ? `${completed} of ${steps.length} setup steps complete` : records.isError ? 'Setup progress could not be checked.' : 'Checking your setup progress…'}</p>
    {records.isError && <div className="mt-3"><p className="text-sm text-muted-foreground">Your saved records may already exist. Retry before creating another.</p><Button variant="outline" className="mt-3" onClick={() => void records.refetch()}>Retry setup check</Button></div>}
    <div className="grid gap-4 md:grid-cols-3 mt-5">{steps.map((step, index) => <Link key={step.href} to={step.href} className="rounded-xl border border-border p-4 hover:border-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
      <span className="mb-3 flex items-center gap-2 text-xs text-primary font-semibold">{step.known && step.done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true"/> : `${index + 1}.`}{!step.known ? 'Not verified' : step.done ? 'Complete' : 'Ready when you are'}</span>
      <h3 className="font-semibold mb-2">{step.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p><ArrowUpRight className="mt-4 h-4 w-4 text-primary" aria-hidden="true"/>
    </Link>)}</div>
    <div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link to={provider ? '/provider/invitations' : '/provider-marketplace'}>{provider ? 'Open your workspaces' : 'Browse care services'}</Link></Button>{!provider && <Button asChild variant="outline"><Link to="/marketplace">Explore the marketplace</Link></Button>}</div>
  </section>;
}
