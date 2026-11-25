import { useState } from 'react';
import { readStayDates } from './boardingStayDates';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BoardingListing } from '@/lib/services/boarding-directory';

export function BoardingShortlistShare({ facilities }: {
  facilities: Pick<BoardingListing, 'slug' | 'name'>[];
}) {
  const [result, setResult] = useState<{ text: string; copied: boolean }>();
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
      setResult({ text, copied: true });
    } catch {
      setResult({ text, copied: false });
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
      <Button type="button" size="sm" variant="outline" onClick={() => void copyShortlist()}>
        Copy shortlist
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {currentResult && (currentResult.copied
          ? 'Shortlist copied. Paste it into a message to share.'
          : 'Select and copy the shortlist below.')}
      </p>
      {currentResult?.copied === false && (
        <div className="space-y-2">
          <Label htmlFor="boarding-shortlist-text">Shortlist to share</Label>
          <Textarea id="boarding-shortlist-text" value={text} readOnly rows={5}
            onFocus={event => event.currentTarget.select()} />
        </div>
      )}
    </div>
  );
}
