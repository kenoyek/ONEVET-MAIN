import {z} from 'zod';
import {providerIdentifier} from '@/lib/provider-identifier';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { emptyProviderDraft, providerCategories, providerDraftError, providerDraftSchema, type ProviderDraftInput } from '@/lib/services/provider-draft-service';

type Props = { initial?: ProviderDraftInput; email?: string; editing?: boolean; onSave: (input: ProviderDraftInput) => Promise<void> };
export function ProviderDraftForm({ initial, email, editing = false, onSave }: Props) {
  const [form, setForm] = useState(initial ?? emptyProviderDraft(email));
  const lock=useRef(false);
  const manualIdentifier=useRef(editing || !!initial?.slug);
  const [fieldErrors,setFieldErrors]=useState<Partial<Record<keyof ProviderDraftInput,string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const field = (key: keyof ProviderDraftInput, value: string) => {
    if(key==='slug')manualIdentifier.current=true;
    setFieldErrors(previous=>({...previous,[key]:undefined,...(key==='name'&&!manualIdentifier.current?{slug:undefined}:{})}));
    setForm(previous => ({...previous,[key]:value,...(key==='name'&&!manualIdentifier.current?{slug:providerIdentifier(value)}:{})}));
  };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current=true;
    setError(''); setFieldErrors({}); setBusy(true);
    try { await onSave(providerDraftSchema.parse(form)); }
    catch (cause) {
      if(cause instanceof z.ZodError){
        const errors:Partial<Record<keyof ProviderDraftInput,string>>={};
        for(const issue of cause.issues){const key=issue.path[0] as keyof ProviderDraftInput;if(key&&!errors[key])errors[key]=issue.message;}
        setFieldErrors(errors);setError('Please check the highlighted organization details.');
        const first=Object.keys(errors)[0];
        // Re-enable fields before focusing the first invalid control.
        requestAnimationFrame(()=>document.getElementById(first==='provider_type'?'provider-type':`provider-${first}`)?.focus());
      }else setError(providerDraftError(cause));
    }
    finally { lock.current=false;setBusy(false); }
  }
  return <form noValidate aria-busy={busy} onSubmit={submit} className="space-y-6">
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
            aria-invalid={!!fieldErrors[key]} aria-describedby={fieldErrors[key]?`provider-${key}-error`:key==='slug'?'provider-slug-help':undefined}
            type={key === 'email' ? 'email' : key === 'website' ? 'url' : key==='phone'?'tel':'text'} disabled={editing && key === 'slug'}
            pattern={key === 'slug' ? '[a-z0-9]+(-[a-z0-9]+)*' : undefined}
            onChange={event => field(key, event.target.value)} />
          {fieldErrors[key]&&<p id={`provider-${key}-error`} className="text-xs text-destructive">{fieldErrors[key]}</p>}
          {key === 'slug' && <p id="provider-slug-help" className="text-xs text-muted-foreground">Suggested from your organization name. You can change it before saving; availability is checked when you save. It stays fixed afterward.</p>}
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
