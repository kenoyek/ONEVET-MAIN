import { useState } from 'react';
import { Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function BoardingShareLink({ slug }: { slug: string }) {
  const [result, setResult] = useState<'copied' | 'manual'>();
  const url = new URL(`/boarding/${encodeURIComponent(slug)}`, window.location.origin).href;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setResult('copied');
    } catch {
      setResult('manual');
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()}>
        <Link2 aria-hidden="true" /> Copy facility link
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {result === 'copied' && 'Facility link copied.'}
        {result === 'manual' && 'Select and copy the facility link below.'}
      </p>
      {result === 'manual' && (
        <div className="max-w-md space-y-2">
          <Label htmlFor="boarding-share-url">Facility link</Label>
          <Input id="boarding-share-url" value={url} readOnly onFocus={event => event.currentTarget.select()} />
        </div>
      )}
    </div>
  );
}
