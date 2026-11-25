import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getBoardingFacility, type BoardingListing } from '@/lib/services/boarding-directory';

type SavedFacility = Pick<BoardingListing, 'slug' | 'name'>;

function ComparisonCard({ facility, search }: { facility: SavedFacility; search: string }) {
  const listing = useQuery({
    queryKey: ['boarding-directory', 'facility', facility.slug],
    queryFn: () => getBoardingFacility(facility.slug),
    retry: false,
    gcTime: 0,
  });

  return (
    <article className="min-w-0 space-y-2 rounded-lg border bg-background p-4 [overflow-wrap:anywhere]">
      <h4 className="font-semibold">{listing.data?.name ?? facility.name}</h4>
      {listing.isPending && <p role="status" className="text-sm">Loading listing…</p>}
      {listing.isError && (
        <div className="text-sm">
          <p role="alert">Could not load this listing.</p>
          <Button type="button" size="sm" variant="outline" onClick={() => void listing.refetch()}>Retry listing</Button>
        </div>
      )}
      {listing.isSuccess && (listing.data ? (
        <>
          <p className="text-sm text-muted-foreground">{listing.data.city}, {listing.data.state}</p>
          {listing.data.description && <p className="whitespace-pre-wrap text-sm">{listing.data.description}</p>}
          <Link className="inline-block text-sm text-primary underline"
            to={{ pathname: `/boarding/${encodeURIComponent(listing.data.slug)}`, search }}
            aria-label={`Open ${listing.data.name} for inquiries`}>Open facility for inquiries</Link>
        </>
      ) : <p className="text-sm">This listing is unavailable.</p>)}
    </article>
  );
}

export function BoardingComparison({ facilities, search }: { facilities: SavedFacility[]; search: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const choices = facilities.filter(item => selected.includes(item.slug));

  return (
    <details className="mt-4 rounded-lg border p-3" onToggle={event => {
      if (!event.currentTarget.open) setComparing(false);
    }}>
      <summary className="cursor-pointer font-semibold">Compare saved facilities</summary>
      <fieldset className="my-3 space-y-2">
        <legend className="text-sm text-muted-foreground">Choose two or three facilities to compare.</legend>
        {facilities.map(item => {
          const checked = selected.includes(item.slug);
          return (
            <label key={item.slug} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={checked} disabled={!checked && choices.length >= 3}
                onChange={event => {
                  setSelected(event.target.checked ? [...choices.map(choice => choice.slug), item.slug]
                    : selected.filter(slug => slug !== item.slug));
                  setComparing(false);
                }} />
              {item.name}
            </label>
          );
        })}
      </fieldset>
      <Button type="button" size="sm" disabled={choices.length < 2} onClick={() => setComparing(true)}>
        Compare selected
      </Button>
      {comparing && choices.length >= 2 && (
        <section className="mt-4 space-y-2" aria-label="Boarding comparison">
          <h3 className="font-semibold">Selected facilities</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {choices.map(item => <ComparisonCard key={item.slug} facility={item} search={search} />)}
          </div>
        </section>
      )}
    </details>
  );
}
