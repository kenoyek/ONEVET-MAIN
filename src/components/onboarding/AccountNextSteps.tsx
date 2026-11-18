import {validContactPhone} from '@/lib/contact-phone';
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
        if (typeof result.count !== 'number' || !Number.isInteger(result.count) || result.count < 0) throw new Error('Record count unavailable');
        return result.count;
      };
      const [animals, farms, businesses] = await Promise.all([
        pets ? count('pets', 'owner_id', profile!.id).catch(() => null) : 0,
        !provider && farm ? count('livestock_farms', 'owner_id', profile!.id).catch(() => null) : 0,
        provider ? count('provider_organizations', 'created_by', user!.id).catch(() => null) : 0,
      ]);
      return {animals, farms, businesses};
    },
  });
  if (!available) return null;
  const contactComplete = !!profile.first_name?.trim() && !!profile.last_name?.trim() && validContactPhone(profile.phone);
  const loaded = records.isSuccess && !records.isError;
  const petsKnown = loaded && records.data?.animals != null;
  const farmsKnown = loaded && records.data?.farms != null;
  const businessKnown = loaded && records.data?.businesses != null;
  const steps = [
    {title: contactComplete ? 'Your contact details' : 'Complete your contact details', description: 'Add your name and a contact phone number for care requests.', href: '/profile', done: contactComplete, known: true},
    ...(provider ? [{title: 'Register your organization', description: 'Save your business, attach documents and submit it for review.', href: '/provider/register', done: !!records.data?.businesses, known: businessKnown}]
      : [...(pets ? [{title: !petsKnown ? 'Check your pet records' : records.data?.animals ? 'Manage your pets' : 'Add your first pet', description: 'Keep your pet’s details ready for bookings and its health journal.', href: petsKnown && records.data?.animals === 0 ? '/pets/new' : '/pets', done: !!records.data?.animals, known: petsKnown}] : []),
        ...(farm ? [{title: !farmsKnown ? 'Check your farm records' : records.data?.farms ? 'Manage your farms' : 'Add your farm', description: 'Keep your farm details and animal groups together before requesting care.', href: isFeatureEnabled('customer_farms_enabled') ? '/farms' : '/farm-care', done: !!records.data?.farms, known: farmsKnown}] : [])]),
  ];
  const completed = steps.filter(step => step.known && step.done).length;
  const known = steps.every(step => step.known);
  const failed = records.isError || (loaded && !known);
  const ready = known && completed === steps.length;
  return <section className="mb-8 rounded-2xl border bg-card p-6 sm:p-8" aria-label="Getting started">
    <p className="eyebrow mb-2">Getting started</p>
    <h2 className="text-2xl">{provider ? 'Set up your business on 1Vet' : ready ? 'Your care setup is ready' : 'Make yourself at home on 1Vet'}</h2>
    <p className="mt-3 text-sm text-muted-foreground">{provider ? 'Registration is the first step. Approval is required before publishing services.' : 'Start with what you need today. You can browse care and shop while setting up your records.'}</p>
    <p role="status" className="mt-4 text-sm font-medium">{known ? `${completed} of ${steps.length} setup steps complete` : failed ? 'Some setup steps could not be checked.' : 'Checking your setup progress…'}</p>
    {failed && <div className="mt-3"><p className="text-sm text-muted-foreground">Your saved records may already exist. Verified steps remain visible. Retry the check or open your records before adding another.</p><Button variant="outline" className="mt-3" disabled={records.isFetching} onClick={() => void records.refetch()}>{records.isFetching ? 'Checking setup…' : 'Retry setup check'}</Button></div>}
    <div className="grid gap-4 md:grid-cols-3 mt-5">{steps.map((step, index) => <Link key={step.href} to={step.href} className="rounded-xl border border-border p-4 hover:border-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
      <span className="mb-3 flex items-center gap-2 text-xs text-primary font-semibold">{step.known && step.done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true"/> : `${index + 1}.`}{!step.known ? 'Not verified' : step.done ? 'Complete' : 'Ready when you are'}</span>
      <h3 className="font-semibold mb-2">{step.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{!step.known ? 'Open your saved records or retry the setup check before creating a new record.' : step.description}</p><ArrowUpRight className="mt-4 h-4 w-4 text-primary" aria-hidden="true"/>
    </Link>)}</div>
    <div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link to={provider ? '/provider/invitations' : '/provider-marketplace'}>{provider ? 'Open your workspaces' : 'Browse care services'}</Link></Button>{!provider && <Button asChild variant="outline"><Link to="/marketplace">Explore the marketplace</Link></Button>}</div>
  </section>;
}
