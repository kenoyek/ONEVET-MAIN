import { useState } from 'react';
import { readStayDates } from './boardingStayDates';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BoardingListing } from '@/lib/services/boarding-directory';

const messages = {
  copied: 'Shortlist copied. Paste it into a message to share.',
  manual: 'Select and copy the shortlist below.',
  shared: 'Shortlist shared with your selected app.',
  shareFailed: 'Could not open sharing. Copy the shortlist to share it.',
};

export function BoardingShortlistShare({ facilities }: {
  facilities: Pick<BoardingListing, 'slug' | 'name'>[];
}) {
  const [result, setResult] = useState<{ text: string; status: keyof typeof messages }>();
  const [includeDates, setIncludeDates] = useState(false);
  const dates = readStayDates();
  const links = facilities.map(({ name, slug }) =>
    `${name}\n${new URL(`/boarding/${encodeURIComponent(slug)}`, window.location.origin).href}`,
  );
  const stay = includeDates && dates ? [`Arrival: ${dates.arrival}\nDeparture: ${dates.departure}`] : [];
  const text = ['Pet boarding shortlist', ...stay, ...links].join('\n\n');
  const currentResult = result?.text === text ? result : undefined;

  async function copyShortlist() {
    try {
      await navigator.clipboard.writeText(text);
      setResult({ text, status: 'copied' });
    } catch {
      setResult({ text, status: 'manual' });
    }
  }

  async function shareShortlist() {
    setResult(undefined);
    try {
      await navigator.share({ title: 'Pet boarding shortlist', text });
      setResult({ text, status: 'shared' });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setResult({ text, status: 'shareFailed' });
      }
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {dates && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={includeDates} onChange={event => setIncludeDates(event.target.checked)}
            className="size-4 accent-primary" />
          Include stay dates ({dates.arrival} to {dates.departure})
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {typeof navigator.share === 'function' && (
          <Button type="button" size="sm" onClick={() => void shareShortlist()}>
            Share shortlist
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={() => void copyShortlist()}>
          Copy shortlist
        </Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {currentResult && messages[currentResult.status]}
      </p>
      {currentResult?.status === 'manual' && (
        <div className="space-y-2">
          <Label htmlFor="boarding-shortlist-text">Shortlist to share</Label>
          <Textarea id="boarding-shortlist-text" value={text} readOnly rows={5}
            onFocus={event => event.currentTarget.select()} />
        </div>
      )}
    </div>
  );
}
