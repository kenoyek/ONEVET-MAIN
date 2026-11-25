import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const dayInMilliseconds = 86_400_000;
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

type StayDates = { arrival: string; departure: string };
const stayDatesKey = 'onevet.boarding-stay-dates';

function readStayDates(): StayDates | null {
  try {
    const dates = JSON.parse(sessionStorage.getItem(stayDatesKey) ?? 'null');
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    if (typeof dates?.arrival !== 'string' || typeof dates.departure !== 'string'
      || !isoDate.test(dates.arrival) || !isoDate.test(dates.departure)
      || dates.arrival < boardingDate.format(new Date()) || dates.departure <= dates.arrival) {
      return null;
    }
    return { arrival: dates.arrival, departure: dates.departure };
  } catch {
    return null;
  }
}

export function BoardingInquiryForm({ name, email }: { name: string; email: string }) {
  const [remembered, setRemembered] = useState(readStayDates);
  const [arrival, setArrival] = useState(remembered?.arrival ?? '');
  const [departure, setDeparture] = useState(remembered?.departure ?? '');
  const [datesNotice, setDatesNotice] = useState(remembered ? 'Using dates remembered in this tab.' : '');
  const [draft, setDraft] = useState<InquiryDraft | null>(null);
  const [error, setError] = useState('');
  const today = boardingDate.format(new Date());
  const arrivalDay = Date.parse(arrival + 'T00:00:00Z');
  const departureDay = Date.parse(departure + 'T00:00:00Z');
  const firstDeparture = new Date(Math.max(Date.parse(today), arrivalDay || 0) + dayInMilliseconds)
    .toISOString().split('T')[0];
  const nights = (departureDay - arrivalDay) / dayInMilliseconds;
  const validStay = arrivalDay >= Date.parse(today) && nights > 0;
  const stayLength = `${nights} ${nights === 1 ? 'night' : 'nights'}`;

  function rememberDates(dates: StayDates | null) {
    try {
      if (dates) sessionStorage.setItem(stayDatesKey, JSON.stringify(dates));
      else sessionStorage.removeItem(stayDatesKey);
      setRemembered(dates);
      setDatesNotice(dates ? 'Dates remembered for other facility pages in this tab.' : 'Remembered dates cleared.');
    } catch {
      setDatesNotice('Could not update remembered dates. Check your browser storage settings.');
    }
  }

  function prepareDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const pets = String(data.get('pets')).trim();
    const notes = String(data.get('notes')).trim();
    const topics = data.getAll('topics');
    const questions = inquiryTopics.filter(({ value }) => topics.includes(value)).map(({ question }) => `- ${question}`);

    if (!(arrivalDay >= Date.parse(boardingDate.format(new Date())) && nights > 0)) {
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
      `Stay length: ${stayLength}`,
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
          <Input id="boarding-arrival" name="arrival" type="date" required min={today} max="9999-12-30"
            value={arrival} onChange={(event) => setArrival(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="boarding-departure">Departure date</Label>
          <Input id="boarding-departure" name="departure" type="date" required min={firstDeparture} max="9999-12-31"
            value={departure} onChange={(event) => setDeparture(event.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p role="status" className="text-sm text-muted-foreground">{validStay ? stayLength : ''}</p>
        {validStay && (arrival !== remembered?.arrival || departure !== remembered?.departure) && (
          <Button type="button" variant="outline" size="sm" onClick={() => rememberDates({ arrival, departure })}>
            Remember dates in this tab
          </Button>
        )}
        {remembered && <Button type="button" variant="outline" size="sm" onClick={() => rememberDates(null)}>
          Clear remembered dates
        </Button>}
      </div>
      {datesNotice && <p role="status" className="text-sm text-muted-foreground">{datesNotice}</p>}
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
