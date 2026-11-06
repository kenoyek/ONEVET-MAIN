import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { providerCatalogService } from '@/lib/services/provider-catalog-service';
export default function PublicProviderProfile() {
  const { slug = '' } = useParams();
  const services = useQuery({ queryKey: ['public-provider', slug], queryFn: () => providerCatalogService.publicServices(slug), enabled: !!slug, staleTime: 0, refetchOnMount: 'always', refetchInterval: 60_000 });
  const organization = services.data?.[0];
  return <div className="min-h-screen bg-background"><Navbar /><main className="container-wide max-w-5xl pt-32 pb-20">
    <Link className="text-primary underline" to="/provider-marketplace">Browse care services</Link>
    {services.isPending ? <p role="status" className="mt-8">Loading provider…</p> : services.isError ? <section className="care-path mt-8"><h1 className="text-2xl mb-4">Could not load this provider</h1><Button onClick={() => void services.refetch()}>Try again</Button></section> : !organization ? <section className="care-path mt-8"><h1 className="text-2xl mb-4">Provider unavailable</h1><p>This provider has no currently eligible published services. Please browse the directory for other care options.</p></section> : <>
      <h1 className="text-3xl my-6">{organization.organization_name}</h1>
      <p className="text-muted-foreground mb-3">{organization.city}, {organization.state}, {organization.country}</p>
      <p className="mb-6">Organization registration reviewed. Service details and base fees are provided by the organization; confirm the scope and total cost before arranging care.</p>
      <div className="care-path mb-8"><h2 className="text-xl mb-3">Appointment requests need confirmation</h2><p className="mb-4">Providers opt into booking requests and publish availability. Choose a service to check times; a request does not reserve a slot until the provider confirms. No online payment is collected.</p><Button asChild><Link to="/contact">Contact the team</Link></Button></div>
      <div className="grid gap-5 sm:grid-cols-2">{services.data?.map(item => <article key={item.id} className="care-path"><h2 className="text-xl mb-3">{item.name}</h2><p className="whitespace-pre-wrap mb-4">{item.description}</p><p className="text-sm text-muted-foreground mb-2">{item.delivery_mode === 'home_visit' ? 'Home visit' : 'At provider location'} · {item.duration_minutes} minutes</p><p className="font-medium">Base fee: {item.currency} {Number(item.base_price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>{item.booking_enabled ? <Button className="mt-4" asChild><Link to={`/booking/new?service_id=${item.id}`}>Check times and request</Link></Button> : <p className="text-sm text-muted-foreground mt-4">Not accepting booking requests.</p>}</article>)}</div>
    </>}
    <p className="text-sm text-muted-foreground mt-8">For an animal in distress, seek an in-person veterinarian. <Link className="text-primary underline" to="/urgent-care">Urgent care guidance</Link></p>
  </main><Footer /></div>;
}
