import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ProviderDraftForm } from '@/components/provider/ProviderDraftForm';
import { useAuth } from '@/lib/auth-context';
import { providerDraftService } from '@/lib/services/provider-draft-service';

export default function ProviderOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const organizations = useQuery({ queryKey: ['provider-drafts', user?.id], queryFn: () => providerDraftService.list(user!.id), enabled: !!user });
  return <div className="min-h-screen bg-background"><Navbar />
    <main className="container-wide pt-32 pb-20 max-w-4xl">
      <p className="eyebrow mb-4">Veterinary & service partners</p>
      <h1 className="text-3xl mb-4">Register your organization</h1>
      <p className="text-muted-foreground mb-8">Save your business details as a private draft. Registration does not grant professional approval or publish your business. After saving, attach documents and submit your organization for review. Staff invitations and bookings are not available yet.</p>
      <section className="care-path mb-8" aria-labelledby="your-organizations">
        <h2 id="your-organizations" className="text-xl mb-4">Your organizations</h2>
        {organizations.isPending ? <p role="status">Loading organizations…</p> : organizations.isError ? <div><p role="alert">Could not load your organizations.</p><Button variant="outline" onClick={() => void organizations.refetch()}>Try again</Button></div> : organizations.data?.length ?
          <ul className="space-y-3">{organizations.data.map(org => <li key={org.id}><Link className="text-primary underline" to={`/provider/organization/${org.slug}`}>{org.name}</Link><span className="ml-3 text-sm text-muted-foreground">{org.verification_status.replaceAll('_', ' ')}</span></li>)}</ul> : <p className="text-muted-foreground">No organizations saved yet.</p>}
      </section>
      <section className="care-path"><h2 className="text-xl mb-2">Organization and primary location</h2>
        <p className="text-sm text-muted-foreground mb-6">Currently supporting Nigeria · Africa/Lagos (WAT) · NGN. Enter the actual address of your primary location.</p>
        <ProviderDraftForm key={user?.id} email={user?.email} onSave={async input => {
          try {
            const saved = await providerDraftService.save(input);
            navigate(`/provider/organization/${saved.slug}`);
          } finally {
            void cache.invalidateQueries({ queryKey: ['provider-drafts', user?.id] });
          }
        }} />
      </section>
    </main>
  </div>;
}
