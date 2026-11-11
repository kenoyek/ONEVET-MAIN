import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { categoryByProvider, providerCatalogService as service, providerServiceSchema, publicationError, type ProviderService, type ProviderServiceInput } from '@/lib/services/provider-catalog-service';
function ServiceEditor({ providerId, category, existing, onSaved }: { providerId: string; category: ProviderServiceInput['category']; existing?: ProviderService; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<ProviderServiceInput>(existing ? { name: existing.name, description: existing.description, category: existing.category as ProviderServiceInput['category'], delivery_mode: existing.delivery_mode as ProviderServiceInput['delivery_mode'], duration_minutes: existing.duration_minutes, base_price: Number(existing.base_price) } : { name: '', description: '', category, delivery_mode: 'clinic_visit', duration_minutes: 30, base_price: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  return <form className="space-y-4" onSubmit={async event => {
    event.preventDefault(); if (busy) return; setBusy(true); setError(''); setSaved(false);
    try { await service.save(providerId, providerServiceSchema.parse(form), existing); setSaved(true); if (!existing) setForm({ ...form, name: '', description: '' }); await onSaved(); }
    catch (cause) { setError(publicationError(cause)); }
    finally { setBusy(false); }
  }}>
    <fieldset disabled={busy} className="space-y-4"><legend className="font-medium mb-3">{existing ? 'Edit private service' : 'Create a service draft'}</legend>
      <div><Label htmlFor={`service-name-${existing?.id ?? 'new'}`}>Public service name</Label><Input id={`service-name-${existing?.id ?? 'new'}`} value={form.name} required minLength={3} maxLength={120} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
      <div><Label htmlFor={`service-description-${existing?.id ?? 'new'}`}>Public service description</Label><Textarea id={`service-description-${existing?.id ?? 'new'}`} value={form.description} required minLength={20} maxLength={3000} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><Label htmlFor={`service-mode-${existing?.id ?? 'new'}`}>Delivery</Label><select className="w-full p-3 border rounded-md bg-background" id={`service-mode-${existing?.id ?? 'new'}`} value={form.delivery_mode} onChange={e => setForm({ ...form, delivery_mode: e.target.value as ProviderServiceInput['delivery_mode'] })}><option value="clinic_visit">At provider location</option><option value="home_visit">Home visit</option></select></div>
        <div><Label htmlFor={`service-duration-${existing?.id ?? 'new'}`}>Duration (minutes)</Label><Input id={`service-duration-${existing?.id ?? 'new'}`} type="number" min={5} max={480} step={1} required value={Number.isNaN(form.duration_minutes) ? '' : form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.valueAsNumber })} /></div>
        <div><Label htmlFor={`service-price-${existing?.id ?? 'new'}`}>Base fee (NGN)</Label><Input id={`service-price-${existing?.id ?? 'new'}`} type="number" min={0} max={9999999999.99} step="0.01" required value={Number.isNaN(form.base_price) ? '' : form.base_price} onChange={e => setForm({ ...form, base_price: e.target.valueAsNumber })} /></div>
      </div>
    </fieldset>
    <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save service draft'}</Button>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {saved && <p role="status">Service draft saved.</p>}
  </form>;
}
export function ProviderServiceManager({ providerId, providerType, slug, approved, suspended }: { providerId: string; providerType: string; slug: string; approved: boolean; suspended: boolean }) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [editing, setEditing] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const category = categoryByProvider[providerType];
  const services = useQuery({ queryKey: ['owned-provider-services', user?.id, providerId], queryFn: () => service.owned(providerId), enabled: !!user });
  async function refresh() {
    await Promise.all([cache.invalidateQueries({ queryKey: ['owned-provider-services', user?.id, providerId] }), cache.invalidateQueries({ queryKey: ['provider-draft', user?.id] }), cache.invalidateQueries({ queryKey: ['provider-marketplace'] }), cache.invalidateQueries({ queryKey: ['public-provider'] }), cache.invalidateQueries({ queryKey: ['provider-launch-public', user?.id] })]);
  }
  return <section id="organization-services" className="care-path mb-8 scroll-mt-28"><h2 className="text-xl mb-3">Services and public listing</h2>
    <p className="text-muted-foreground mb-4">Draft your services, then publish when organization approval and credentials are current. Publishing makes your organization name, identifier, category, city/state and service details public. Your registration email, phone, street address and documents stay private. Set availability in the booking section to accept appointment requests. Online payments remain unavailable.</p>
    {!category ? <p>Service publishing is not available for this organization category yet.</p> : <>
      <label className="flex gap-3 items-start mb-5"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1" />I understand which details will appear publicly when I publish.</label>
      {!approved && <p className="mb-4 text-sm">You can prepare drafts now. Complete organization verification before publishing.</p>}
      {services.isPending ? <p role="status">Loading services…</p> : services.isError ? <><p role="alert">Could not load services.</p><Button variant="outline" onClick={() => void services.refetch()}>Refresh services</Button></> : <div className="space-y-5">
        {!services.data?.length && <p>No services saved yet.</p>}
        {services.data?.map(item => <article key={item.id} className="border rounded-lg p-4 space-y-3">
          <h3 className="font-medium">{item.name}</h3><p className="text-sm">{item.is_published ? 'Published when eligibility checks pass' : 'Private draft'} · NGN {Number(item.base_price).toLocaleString('en-NG')} · {item.duration_minutes} minutes</p>
          <div className="flex flex-wrap gap-3">
            {!item.is_published && !suspended && <Button variant="outline" disabled={busy} onClick={() => { setEditing(editing === item.id ? '' : item.id); setError(''); }}>{editing === item.id ? 'Close editor' : 'Edit service'}</Button>}
            <Button disabled={busy || (!item.is_published && (!approved || suspended || !consent))} onClick={async () => {
              if (busy) return; setBusy(true); setError(''); setMessage('');
              try { await service.publish(item, !item.is_published); setMessage(item.is_published ? 'Service unpublished.' : 'Service published. Booking availability is controlled by your schedule. Online payments remain disabled.'); setEditing(''); await refresh(); }
              catch (cause) { setError(publicationError(cause)); }
              finally { setBusy(false); }
            }}>{busy ? 'Working…' : item.is_published ? 'Unpublish service' : 'Publish service'}</Button>
          </div>
          {editing === item.id && !item.is_published && !suspended && <ServiceEditor key={`${item.id}-${item.version}`} providerId={providerId} category={category} existing={item} onSaved={refresh} />}
        </article>)}
        <Button variant="outline" disabled={busy} onClick={() => void refresh()}>Refresh services</Button>
        <Button variant="link" asChild><Link to={`/provider/public/${slug}`}>View public provider page</Link></Button>
        {!suspended && <ServiceEditor providerId={providerId} category={category} onSaved={async () => { await refresh(); }} />}
      </div>}
    </>}
    {error && <p role="alert" className="mt-4 text-destructive">{error}</p>}{message && <p role="status" className="mt-4">{message}</p>}
  </section>;
}
