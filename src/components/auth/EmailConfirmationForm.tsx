import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function EmailConfirmationForm({ onBack }: { onBack: () => void }) {
  const { state } = useLocation();
  const [email, setEmail] = useState(() => typeof state?.confirmationEmail === 'string' && state.confirmationEmail.length <= 254 ? state.confirmationEmail : '');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(Date.now);
  const remaining = Math.max(0, Math.ceil((until - now) / 1000));
  const coolingDown = remaining > 0;
  useEffect(() => {
    if (!coolingDown) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [coolingDown]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current || coolingDown) return;
    const validated = z.string().trim().email().max(254).safeParse(email);
    setError(''); setNotice('');
    if (!validated.success) { setError('Enter a valid email address.'); return; }
    inFlight.current = true; setBusy(true);
    try {
      const { error: cause } = await supabase.auth.resend({ type: 'signup', email: validated.data, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (cause) throw cause;
      setNotice('If this address needs confirmation, a new link will be sent. Check your inbox and spam folder.');
    } catch { setError('We couldn’t request another link. Wait a minute and try again.'); }
    finally { const time = Date.now(); setNow(time); setUntil(time + 60_000); inFlight.current = false; setBusy(false); }
  }
  return <section className="space-y-5">
    <div><h2 className="text-2xl font-medium mb-3">Confirm your email</h2><p className="text-sm text-muted-foreground leading-relaxed">Request a fresh signup link for your account. Use it to finish confirming your email before signing in.</p></div>
    <form noValidate onSubmit={submit} aria-busy={busy} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4 min-w-0">
        <div className="space-y-2"><Label htmlFor="confirmation-email">Email address</Label><Input id="confirmation-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={event => setEmail(event.target.value)} aria-invalid={!!error} aria-describedby={error ? 'confirmation-error' : undefined} /></div>
        <Button type="submit" className="w-full" disabled={busy || coolingDown}>{busy ? 'Requesting link…' : 'Send confirmation link'}</Button>
      </fieldset>
      {coolingDown && <p className="text-xs text-muted-foreground" aria-live="off">You can request another link in {remaining}s.</p>}
      {error && <p id="confirmation-error" role="alert" className="text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-primary/5 p-4 text-sm leading-relaxed">{notice}</p>}
    </form>
    <Button type="button" variant="ghost" className="w-full" onClick={onBack}>Back to sign in</Button>
  </section>;
}
