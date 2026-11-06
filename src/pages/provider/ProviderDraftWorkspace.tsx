import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ProviderServiceManager } from '@/components/provider/ProviderServiceManager';
import { ProviderVerificationPanel } from '@/components/provider/ProviderVerificationPanel';
import { ProviderDraftForm } from '@/components/provider/ProviderDraftForm';
import { useAuth } from '@/lib/auth-context';
import { providerCategories, providerDraftService } from '@/lib/services/provider-draft-service';

export default function ProviderDraftWorkspace() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const cache = useQueryClient();
  const draft = useQuery({ queryKey: ['provider-draft', user?.id, slug], queryFn: () => providerDraftService.get(slug), enabled: !!user && !!slug });
  const organization = draft.data?.organization;
  const location = draft.data?.location;
  const isOwner = organization?.created_by === user?.id;
  return <div className="min-h-screen bg-background"><Navbar /><main className="container-wide max-w-4xl pt-32 pb-20">
    <Link to="/provider/register" className="text-primary underline">Your organizations</Link>
    {draft.isPending ? <p role="status" className="mt-8">Loading organization…</p> : draft.isError || !organization || !location ? <section className="care-path mt-8"><h1 className="text-2xl mb-4">Organization unavailable</h1><p className="mb-5">This organization could not be loaded. Check your connection and that you are signed into the account that registered it.</p><Button onClick={() => void draft.refetch()}>Try again</Button></section> : <>
      <h1 className="text-3xl my-6">{organization.name}</h1>
      <section className="care-path mb-8"><h2 className="text-xl mb-3">Private organization workspace</h2>
        <p className="mb-2">Status: {organization.verification_status.replaceAll('_', ' ')}</p>
        <p className="text-muted-foreground">Submit registration evidence for organization review, then choose which services to publish below. Staff invitations and booking requests remain unavailable.</p>
        <p className="mt-4">{providerCategories[organization.provider_type as keyof typeof providerCategories] ?? organization.provider_type} · {organization.country} · {organization.timezone} · {organization.currency}</p>
        <Button variant="outline" className="mt-5" asChild><Link to="/profile">Professional profile</Link></Button>
        <Button variant="link" asChild><Link to="/contact">Contact support</Link></Button>
      </section>
      {isOwner && <ProviderVerificationPanel key={`${user?.id}-${organization.id}`} providerId={organization.id} status={organization.verification_status} suspended={organization.status === 'suspended'} />}
      {isOwner && <ProviderServiceManager key={`${user?.id}-${organization.id}`} providerId={organization.id} providerType={organization.provider_type} slug={organization.slug} approved={organization.verification_status === 'approved'} suspended={organization.status === 'suspended'} />}
      {!isOwner && <p className="mb-6">You are viewing this organization as an administrator. <Link className="text-primary underline" to="/admin/verifications">Open the verification queue</Link> to review its application.</p>}
      <section className="care-path"><h2 className="text-xl mb-6">Business and primary location</h2>
        {!isOwner || !['draft','more_info_required','rejected'].includes(organization.verification_status) || organization.status === 'suspended' ? <p>This workspace can be edited by its registering owner when the application is a draft or has been returned for corrections.</p> : <ProviderDraftForm key={`${organization.id}-${organization.updated_at}`} editing initial={{ name: organization.name, slug: organization.slug, provider_type: organization.provider_type as keyof typeof providerCategories, email: organization.email, phone: organization.phone, website: organization.website, description: organization.description, state: organization.state, city: organization.city, address: organization.address, primary_location_name: location.name }} onSave={async input => {
          await providerDraftService.save(input, organization.id);
          toast.success('Organization draft saved');
          await Promise.all([cache.invalidateQueries({ queryKey: ['provider-draft', user?.id, slug] }), cache.invalidateQueries({ queryKey: ['provider-drafts', user?.id] })]);
        }} />}
      </section>
    </>}
  </main></div>;
}
