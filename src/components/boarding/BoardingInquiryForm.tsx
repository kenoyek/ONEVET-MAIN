import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const boardingDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Africa/Lagos' });

const inquiryTopics = [
  { value: 'vaccinations', label: 'Vaccinations and records', question: 'What vaccinations and records do you require?' },
  { value: 'care', label: 'Feeding and medication', question: 'Can you accommodate special feeding routines or administer medication?' },
  { value: 'handoff', label: 'Drop-off and pick-up', question: 'What are your drop-off and pick-up hours?' },
];

type InquiryDraft = { subject: string; body: string };

function BoardingInquiryDraft({ email, draft }: { email: string; draft: InquiryDraft }) {
  const [copyStatus, setCopyStatus] = useState('');
  const recipient = encodeURIComponent(email).replace(/%40/g, '@');
  const href = `mailto:${recipient}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
  const details = `To: ${email}\nSubject: ${draft.subject}\n\n${draft.body.replace(/\r\n/g, '\n')}`;

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(details);
      setCopyStatus('Inquiry copied. Paste the details into a new email.');
    } catch {
      setCopyStatus('Select and copy the inquiry details below.');
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex flex-wrap gap-2">
        <Button asChild><a href={href}>Open email draft</a></Button>
        <Button type="button" variant="outline" onClick={() => void copyDraft()}>Copy inquiry</Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {copyStatus || 'Send the draft from your email app, or copy the details into webmail.'}
      </p>
      <Label htmlFor="boarding-inquiry-draft">Inquiry details</Label>
      <Textarea id="boarding-inquiry-draft" readOnly value={details} rows={7} />
    </div>
  );
}

export function BoardingInquiryForm({ name, email }: { name: string; email: string }) {
  const [arrival, setArrival] = useState('');
  const [draft, setDraft] = useState<InquiryDraft | null>(null);
  const [error, setError] = useState('');
  const today = boardingDate.format(new Date());

  function prepareDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const departure = String(data.get('departure'));
    const pets = String(data.get('pets')).trim();
    const notes = String(data.get('notes')).trim();
    const topics = data.getAll('topics');
    const questions = inquiryTopics.filter(({ value }) => topics.includes(value)).map(({ question }) => `- ${question}`);

    if (arrival < boardingDate.format(new Date()) || departure <= arrival) {
      setError('Choose an arrival date from today onward and a departure date after arrival.');
      return;
    }
    if (!pets) {
      setError('Enter the number and type of pets you plan to board.');
      return;
    }

    const subject = `Boarding inquiry for ${name.replace(/[\r\n]+/g, ' ')}`;
    const body = [
      'Hello,',
      '',
      'Could you confirm availability and rates for this stay?',
      '',
      `Arrival: ${arrival}`,
      `Departure: ${departure}`,
      `Pets: ${pets}`,
      ...(notes ? [`Additional details: ${notes}`] : []),
      ...(questions.length ? ['', 'Questions about the stay:', ...questions] : []),
      '',
      'Thank you!',
    ].join('\r\n');
    setDraft({ subject, body });
  }

  return (
    <form className="space-y-4" onSubmit={prepareDraft} onChange={() => {
      setDraft(null);
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
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Questions to include (optional)</legend>
        {inquiryTopics.map(({ value, label }) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="topics" value={value} className="size-4 accent-primary" />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="boarding-notes">Additional details (optional)</Label>
        <Textarea id="boarding-notes" name="notes" maxLength={400} rows={3} placeholder="Feeding needs or questions for the facility" />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant={draft ? 'outline' : 'default'}>Prepare email</Button>
      {draft ? <BoardingInquiryDraft email={email} draft={draft} /> : (
        <p className="text-sm text-muted-foreground">Send an inquiry to ask the facility about availability.</p>
      )}
    </form>
  );
}
