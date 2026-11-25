import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { shortlistNoteLimit, type SavedFacility } from './useBoardingShortlist';

export function BoardingShortlistNote({ facility, onSave }: {
  facility: SavedFacility;
  onSave: (note: string) => boolean;
}) {
  const id = useId();
  const [notice, setNotice] = useState('');

  return (
    <details className="w-full rounded-lg border p-2">
      <summary className="cursor-pointer text-sm font-medium">{facility.note ? 'Edit note' : 'Add note'}</summary>
      <form className="mt-2 space-y-2" onSubmit={event => {
        event.preventDefault();
        const note = String(new FormData(event.currentTarget).get('note') ?? '').trim();
        setNotice(onSave(note) ? (note ? 'Note saved.' : 'Note cleared.') : 'Could not save the note.');
      }}>
        <Label htmlFor={id}>Note for {facility.name}</Label>
        <Textarea key={facility.note} id={id} name="note" defaultValue={facility.note ?? ''}
          maxLength={shortlistNoteLimit} rows={2} placeholder="Quote, availability, or a follow-up"
          onChange={() => setNotice('')} />
        <p className="text-sm text-muted-foreground">Saved in this browser. Save an empty note to clear it.</p>
        <Button type="submit" size="sm" variant="outline">Save note</Button>
        <p role="status" className="text-sm">{notice}</p>
      </form>
    </details>
  );
}
