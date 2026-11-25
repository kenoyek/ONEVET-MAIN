import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { setBoardingListing, type BoardingListing } from '@/lib/services/boarding-directory';

export function BoardingListingPanel({
  id, listing, approved, published, onChange,
}: {
  id: string;
  listing: BoardingListing;
  approved: boolean;
  published: boolean;
  onChange: (published: boolean) => void;
}) {
  const { name, slug, description, city, state, email } = listing;
  const [consent, setConsent] = useState(false);
  const cache = useQueryClient();
  const save = useMutation({
    mutationFn: (visible: boolean) => setBoardingListing(id, visible),
    onSuccess: (_, visible) => {
      setConsent(false);
      onChange(visible);
      void cache.invalidateQueries({ queryKey: ['boarding-directory'] });
    },
  });

  return (
    <section id="boarding-directory" className="care-path mb-8 scroll-mt-28 space-y-3" aria-labelledby="boarding-listing-title">
      <h2 id="boarding-listing-title" className="text-xl">Boarding directory listing</h2>
      <p className="text-sm text-muted-foreground">Publish your facility name, description, city, state, and business email for boarding inquiries.</p>
      {(!approved || published) && <p role="status">{!approved ? 'Your facility needs current approval to appear in the directory.' : 'Publishing is enabled while your approval and evidence remain current.'}</p>}
      {approved && !published && (
        <>
          <section aria-labelledby="boarding-preview-title" className="space-y-3 rounded-lg border bg-background p-4">
            <h3 id="boarding-preview-title" className="text-sm font-semibold">Public listing preview</h3>
            <p className="break-words text-lg font-semibold">{name}</p>
            <p className="break-words text-sm text-muted-foreground">{city}, {state}</p>
            {description && <p className="whitespace-pre-wrap break-words text-sm">{description}</p>}
            <p className="break-words text-sm"><span className="font-medium">Business email</span> {email}</p>
          </section>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={consent} disabled={save.isPending} onChange={event => setConsent(event.target.checked)} />
            I agree to show these facility details and business email in the public directory.
          </label>
        </>
      )}
      <div className="flex flex-wrap gap-2">
        {published || approved ? <Button disabled={save.isPending || (!published && !consent)}
          onClick={() => save.mutate(!published)}>{published ? 'Unpublish listing' : 'Publish listing'}</Button> : null}
        <Button asChild variant="outline">
          {published && approved
            ? <Link to={`/boarding/${encodeURIComponent(slug)}`}>View public listing</Link>
            : <Link to="/boarding">Open boarding directory</Link>}
        </Button>
      </div>
      {save.isError && <p role="alert" className="text-sm text-destructive">Could not confirm the listing update. Try again.</p>}
    </section>
  );
}
