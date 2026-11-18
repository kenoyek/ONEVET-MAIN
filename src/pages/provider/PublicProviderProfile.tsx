import {bookingAnimalContext,withBookingAnimal} from '@/lib/booking-animal-context';
import {useEffect,useState} from 'react';
import {MapPin,ShieldCheck,Search} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {SEO} from '@/components/shared/SEO';
import {serviceCategoryLabels,serviceFee,serviceDelivery} from '@/lib/service-display';
import './public-provider.css';
import { PublicServiceAvailability } from '@/components/provider/PublicServiceAvailability';
import { PageHeading } from '@/components/layout/PageHeading';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { providerCatalogService } from '@/lib/services/provider-catalog-service';
export default function PublicProviderProfile() {
  const { slug = '' } = useParams();
  const [params]=useSearchParams();
  const animalContext=bookingAnimalContext(params.get('animal'));
  const services = useQuery({ queryKey: ['public-provider', slug], queryFn: () => providerCatalogService.publicServices(slug), enabled: !!slug, staleTime: 0, refetchOnMount: 'always', refetchInterval: 60_000 });
  const organization = services.data?.[0];
  const [search,setSearch]=useState('');const [category,setCategory]=useState('all');
  useEffect(()=>{setSearch('');setCategory('all');},[slug]);
  const categories=[...new Set((services.data??[]).map(item=>item.category).filter((value):value is string=>!!value))].sort();
  const visible=(services.data??[]).filter(item=>(category==='all'||item.category===category)&&`${item.name??''} ${item.description??''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  return <div className="public-provider-profile min-h-screen bg-background"><SEO title={organization?.organization_name||'Provider profile'} description="Review currently published services, base fees and listed availability. Appointment requests need provider confirmation."/><Navbar /><main id="main-content" tabIndex={-1} className="container-wide max-w-5xl pt-32 pb-20">
    <Link className="text-primary underline" to={withBookingAnimal("/provider-marketplace",animalContext)}>Browse care services</Link>
    {services.isPending ? <p role="status" className="mt-8">Loading provider…</p> : services.isError ? <section className="care-path mt-8"><h1 className="text-2xl mb-4">Could not load this provider</h1><Button onClick={() => void services.refetch()}>Try again</Button></section> : !organization ? <section className="care-path mt-8"><h1 className="text-2xl mb-4">Provider unavailable</h1><p>This provider has no currently eligible published services. Please browse the directory for other care options.</p></section> : <>
      <PageHeading size="workspace" className="my-6" title={<> {organization.organization_name} </>}/>
      <p className="text-muted-foreground mb-4 flex items-center gap-2"><MapPin size={17} aria-hidden="true"/>{[organization.city,organization.state,organization.country].filter(Boolean).join(', ')||'Confirm location with provider'}</p>
      <p className="mb-6 leading-relaxed text-sm"><ShieldCheck className="inline-block mr-2 text-primary" size={17} aria-hidden="true"/>Organization registration reviewed. Confirm service scope and total costs with the provider.</p>
      <div className="provider-request-note"><h2 className="text-xl mb-3">Appointment requests need confirmation</h2><p className="mb-4">Choose a service to check available times. Requests need provider confirmation and do not reserve a slot. No online payment is collected.</p><Link className="text-xs underline underline-offset-4" to="/contact">Questions? Contact the team</Link></div>
      <section aria-labelledby="provider-services-heading"><div className="provider-services-heading"><h2 id="provider-services-heading">Explore published services</h2><p role="status" className="text-sm text-muted-foreground">Showing {visible.length} of {services.data?.length} published services</p></div>
      <div className="provider-service-filters"><label><span>Search this provider’s services</span><div className="relative"><Search size={17} className="absolute left-3 top-3.5 text-muted-foreground" aria-hidden="true"/><Input className="pl-9" type="search" maxLength={120} value={search} onChange={event=>setSearch(event.target.value)} placeholder="e.g. grooming or check-up"/></div></label><label><span>Service category</span><select value={category} onChange={event=>setCategory(event.target.value)}><option value="all">All published services</option>{categories.map(value=><option key={value} value={value}>{serviceCategoryLabels[value]??value}</option>)}</select></label>{(search||category!=='all')&&<Button variant="ghost" onClick={()=>{setSearch('');setCategory('all');}}>Clear service filters</Button>}</div>
      {!visible.length?<section className="care-path"><h3 className="text-xl mb-3">No published services match these filters.</h3><p className="text-sm text-muted-foreground">Clear your filters to see this provider’s current listings.</p></section>:<div className="grid gap-5 sm:grid-cols-2">{visible.map(item => <article key={item.id} className="care-path provider-service-card"><p className="eyebrow mb-3">{serviceCategoryLabels[item.category??'']??'Published service'}</p><h3 className="text-xl mb-3">{item.name}</h3><p className="whitespace-pre-wrap mb-4">{item.description}</p><p className="text-sm text-muted-foreground mb-2">{serviceDelivery(item.delivery_mode)} · {item.duration_minutes!=null&&Number.isFinite(item.duration_minutes)&&item.duration_minutes>0?`${item.duration_minutes} minutes`:'Confirm duration'}</p><p className="font-medium">Base fee: {serviceFee(item.base_price,item.currency)}</p>{item.booking_enabled ? <PublicServiceAvailability key={`${item.id}-${item.service_version}-${animalContext}`} animalContext={animalContext} serviceId={item.id!} version={item.service_version!} serviceName={item.name??undefined} /> : <p className="text-sm text-muted-foreground mt-4">Not accepting booking requests.</p>}</article>)}</div>}</section>
    </>}
    <p className="text-sm text-muted-foreground mt-8">For an animal in distress, seek an in-person veterinarian. <Link className="text-primary underline" to="/urgent-care">Urgent care guidance</Link></p>
  </main><Footer /></div>;
}
