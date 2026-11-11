import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { categoryByProvider, providerCatalogService } from '@/lib/services/provider-catalog-service';
import { appointmentService } from '@/lib/services/appointment-service';

type Props = { providerId: string; slug: string; providerType: string; status: string; suspended: boolean };
export function ProviderLaunchGuide({ providerId, slug, providerType, status, suspended }: Props) {
  const { user } = useAuth();
  const supportsServices = !!categoryByProvider[providerType];
  const published = useQuery({ queryKey: ['provider-launch-public', user?.id, providerId, slug], queryFn: () => providerCatalogService.publicServices(slug), enabled: !!user && supportsServices, refetchInterval: 30_000 });
  const schedule = useQuery({ queryKey: ['provider-booking-schedule', user?.id, providerId], queryFn: () => appointmentService.schedule(providerId), enabled: !!user && supportsServices });
  const reviewing = ['submitted', 'under_review'].includes(status);
  const approved = status === 'approved' && !suspended;
  const loading = supportsServices && (published.isPending || schedule.isPending);
  const failed = supportsServices && (published.isError || schedule.isError);
  const hasListing = approved && !published.isError && !!published.data?.length;
  const hasHours = approved && !schedule.isError && !!schedule.data?.enabled && Array.isArray(schedule.data.weekly) && schedule.data.weekly.length > 0;
  const steps = [
    { title: 'Business details saved', done: true, text: 'Your organization and primary location are registered privately.', href: '#business-details' },
    { title: 'Organization verification', done: approved, text: suspended ? 'Your organization is suspended. Contact support for the next steps.' : reviewing ? 'Your application is with the review team. Check the verification section for updates.' : approved ? 'Your organization has been approved. Professional credentials must stay current.' : ['more_info_required', 'rejected'].includes(status) ? 'Read the reviewer feedback, save corrections and attach current evidence before resubmitting.' : 'Attach your registration evidence, then submit your saved details for review.', href: '#organization-verification' },
    ...(supportsServices ? [
      { title: 'Public service listing', done: hasListing, text: hasListing ? 'At least one service is visible in the public catalogue.' : 'Prepare a service draft below. After approval, give consent and publish it.', href: '#organization-services' },
      { title: 'Booking availability', done: hasHours, text: hasHours ? 'Booking requests are enabled with saved weekly opening hours.' : 'Choose your weekly opening hours and enable booking requests. Publishing alone does not open your calendar.', href: '#organization-availability' },
    ] : [{ title: 'Shop catalogue', done: false, text: 'After approval, contact the team to add your real products and stock to the shop. Online checkout remains unavailable.', href: '/contact' }]),
  ];
  return <section aria-labelledby="launch-guide-title" className="mb-8 rounded-2xl border bg-card p-5 sm:p-8">
    <p className="eyebrow mb-3">Your next steps</p>
    <h2 id="launch-guide-title" className="text-2xl mb-3">Get ready to welcome clients</h2>
    <p className="text-sm text-muted-foreground mb-6">Registration, approval, publication and availability are separate steps. Follow the guide below to finish your setup.</p>
    {loading && <p role="status" className="mb-4 text-sm">Checking your public listing and saved availability…</p>}
    {failed && <div role="alert" className="mb-5 rounded-xl border p-4"><p className="text-sm">Some setup checks could not be loaded. Refresh them before relying on this guide.</p><Button type="button" variant="outline" className="mt-3" onClick={() => { void published.refetch(); void schedule.refetch(); }}>Refresh setup checks</Button></div>}
    <ol className="grid gap-4 sm:grid-cols-2">{steps.map((step, index) => <li key={step.title} className="min-w-0 rounded-xl border p-4">
      <div className="flex items-center gap-3 mb-2">{step.done ? <CheckCircle2 aria-label="Complete" className="h-5 w-5 shrink-0 text-primary" /> : <Circle aria-label="To review" className="h-5 w-5 shrink-0 text-muted-foreground" />}<h3 className="font-semibold">{index + 1}. {step.title}</h3></div>
      <p className="text-sm leading-relaxed text-muted-foreground mb-3">{step.text}</p>
      {step.href.startsWith('#') ? <a href={step.href} className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-4">Open this step<ArrowDown className="h-3 w-3" aria-hidden="true" /></a> : <Link className="text-sm text-primary underline underline-offset-4" to={step.href}>Contact the team</Link>}
    </li>)}</ol>
    <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{supportsServices ? 'Opening hours do not guarantee an available slot. Each request still needs confirmation. ' : ''}Online payments remain unavailable.</p>
  </section>;
}
