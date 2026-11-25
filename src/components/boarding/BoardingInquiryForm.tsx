import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const boardingDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Africa/Lagos' });

export function BoardingInquiryForm({ name, email }: { name: string; email: string }) {
  const [arrival, setArrival] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const today = boardingDate.format(new Date());

  function prepareDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const departure = String(data.get('departure'));
    const pets = String(data.get('pets')).trim();
    const notes = String(data.get('notes')).trim();

    if (arrival < boardingDate.format(new Date()) || departure <= arrival) {
      setError('Choose an arrival date from today onward and a departure date after arrival.');
      return;
    }
    if (!pets) {
      setError('Enter the number and type of pets you plan to board.');
      return;
    }

    const recipient = encodeURIComponent(email).replace(/%40/g, '@');
    const subject = encodeURIComponent(`Boarding inquiry for ${name.replace(/[\r\n]+/g, ' ')}`);
    const body = encodeURIComponent([
      'Hello,',
      '',
      'Could you confirm availability and rates for this stay?',
      '',
      `Arrival: ${arrival}`,
      `Departure: ${departure}`,
      `Pets: ${pets}`,
      ...(notes ? [`Additional details: ${notes}`] : []),
      '',
      'Thank you!',
    ].join('\r\n'));
    setDraft(`mailto:${recipient}?subject=${subject}&body=${body}`);
  }

  return (
    <form className="space-y-4" onSubmit={prepareDraft} onChange={() => {
      setDraft('');
      setError('');
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="boarding-arrival">Arrival date</Label>
          <Input id="boarding-arrival" name="arrival" type="date" required min={today}
            value={arrival} onChange={(event) => setArrival(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="boarding-departure">Departure date</Label>
          <Input id="boarding-departure" name="departure" type="date" required min={arrival || today} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="boarding-pets">Pets</Label>
        <Input id="boarding-pets" name="pets" required maxLength={160} placeholder="e.g. 2 dogs, one small and one medium" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="boarding-notes">Additional details (optional)</Label>
        <Textarea id="boarding-notes" name="notes" maxLength={400} rows={3} placeholder="Feeding needs or questions for the facility" />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant={draft ? 'outline' : 'default'}>Prepare email</Button>
        {draft && <Button asChild><a href={draft}>Open email draft</a></Button>}
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {draft ? 'Your draft is ready. Open it in your email app to review and send.' : 'Review and send the inquiry from your email app. The facility will confirm availability.'}
      </p>
    </form>
  );
}
