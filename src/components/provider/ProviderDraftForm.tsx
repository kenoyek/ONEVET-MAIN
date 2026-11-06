import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { emptyProviderDraft, providerCategories, providerDraftError, providerDraftSchema, type ProviderDraftInput } from '@/lib/services/provider-draft-service';

type Props = { initial?: ProviderDraftInput; email?: string; editing?: boolean; onSave: (input: ProviderDraftInput) => Promise<void> };
export function ProviderDraftForm({ initial, email, editing = false, onSave }: Props) {
  const [form, setForm] = useState(initial ?? emptyProviderDraft(email));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const field = (key: keyof ProviderDraftInput, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(''); setBusy(true);
    try { await onSave(providerDraftSchema.parse(form)); }
    catch (cause) { setError(providerDraftError(cause)); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-6">
    <fieldset disabled={busy} className="space-y-5">
      <legend className="sr-only">Organization details</legend>
      <div className="space-y-2"><Label htmlFor="provider-type">Business category</Label>
        <select id="provider-type" value={form.provider_type} disabled={editing} onChange={e => field('provider_type', e.target.value)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
          {Object.entries(providerCategories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {([
          ['name', 'Organization name', 120, 2], ['slug', 'Organization identifier', 80, 3],
          ['email', 'Business email', 254, 3], ['phone', 'Business phone (optional)', 40, 0],
          ['state', 'State / region', 80, 2], ['city', 'City / town', 80, 2],
          ['address', 'Street address', 300, 5], ['primary_location_name', 'Branch name (optional)', 120, 0],
          ['website', 'Website (optional, https://)', 300, 0],
        ] as const).map(([key, label, max, min]) => <div className="space-y-2" key={key}>
          <Label htmlFor={`provider-${key}`}>{label}</Label>
          <Input id={`provider-${key}`} value={form[key]} required={min > 0} minLength={min || undefined} maxLength={max}
            type={key === 'email' ? 'email' : key === 'website' ? 'url' : 'text'} disabled={editing && key === 'slug'}
            pattern={key === 'slug' ? '[a-z0-9]+(-[a-z0-9]+)*' : undefined}
            onChange={event => field(key, event.target.value)} />
          {key === 'slug' && <p className="text-xs text-muted-foreground">Lowercase letters, numbers and hyphens. This identifier stays fixed after saving.</p>}
        </div>)}
      </div>
      <div className="space-y-2"><Label htmlFor="provider-description">About the organization (optional)</Label>
        <Textarea id="provider-description" value={form.description} maxLength={3000} onChange={e => field('description', e.target.value)} />
      </div>
    </fieldset>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Button type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Save organization draft'}</Button>
  </form>;
}
