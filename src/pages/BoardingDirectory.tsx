import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Bookmark, MapPin } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useBoardingShortlist } from '@/components/boarding/useBoardingShortlist';
import { BoardingEmailLink } from '@/components/boarding/BoardingEmailLink';
import { BoardingShortlistNote } from '@/components/boarding/BoardingShortlistNote';
import { BoardingComparison } from '@/components/boarding/BoardingComparison';
import { BoardingShortlistShare } from '@/components/boarding/BoardingShortlistShare';
import { Footer } from '@/components/layout/Footer';
import { PageHeading } from '@/components/layout/PageHeading';
import { SEO } from '@/components/shared/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NigeriaStatePicker } from '@/components/shared/NigeriaStatePicker';
import { Label } from '@/components/ui/label';
import { boardingRegistrationPath } from '@/lib/registration-intent';
import { listBoardingFacilities } from '@/lib/services/boarding-directory';

export default function BoardingDirectory() {
  const { saved, update, updateNote, updateContacted, storageError } = useBoardingShortlist();
  const [awaitingOutreachOnly, setAwaitingOutreachOnly] = useState(false);
  const visibleSaved = awaitingOutreachOnly ? saved.filter(item => !item.contacted) : saved;
  const { hash, key } = useLocation();
  const shortlist = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (hash !== '#saved-facilities' || !shortlist.current) return;
    shortlist.current.open = true;
    shortlist.current.querySelector('summary')?.focus();
  }, [hash, key]);

  const [params, setParams] = useSearchParams();
  const city = (params.get('city') ?? '').trim().slice(0, 80);
  const state = (params.get('state') ?? '').trim().slice(0, 80);
  const [draftCity, setDraftCity] = useState(city);
  const [draftState, setDraftState] = useState(state);
  const [pagination, setPagination] = useState<{ city: string; state: string; pages: string[] }>({ city, state, pages: [] });
  const pages = pagination.city === city && pagination.state === state ? pagination.pages : [];
  const cursor = pages.at(-1);

  useEffect(() => {
    setDraftCity(city);
    setDraftState(state);
  }, [city, state]);

  function searchLocation(cityValue: string, stateValue: string) {
    const nextCity = cityValue.trim().slice(0, 80);
    const nextState = stateValue.trim().slice(0, 80);
    setDraftCity(nextCity);
    setDraftState(nextState);
    setPagination({ city: nextCity, state: nextState, pages: [] });
    if (nextCity === city && nextState === state) return;
    const next = new URLSearchParams(params);
    if (nextCity) next.set('city', nextCity);
    else next.delete('city');
    if (nextState) next.set('state', nextState);
    else next.delete('state');
    setParams(next);
  }
  const listings = useQuery({
    queryKey: ['boarding-directory', city, state, cursor],
    queryFn: () => state ? listBoardingFacilities(city, cursor, state) : listBoardingFacilities(city, cursor),
    retry: false,
  });
  const last = listings.data?.facilities.at(-1);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Pet boarding directory" description="Find approved pet boarding facilities in Nigeria and contact them directly." />
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container-wide space-y-6 pb-20 pt-28">
        <Link to="/services" className="text-sm text-primary underline">Back to care services</Link>
        <PageHeading size="display" title="Pet boarding directory"
          description="Browse approved facilities and contact them directly to ask about dates, rates, and requirements for your pet’s stay." />
        <details id="saved-facilities" ref={shortlist} className="scroll-mt-28 rounded-xl border bg-card p-4">
          <summary className="scroll-mt-28 cursor-pointer font-semibold">Saved facilities ({saved.length})</summary>
          <p className="my-3 text-sm text-muted-foreground">Your shortlist is saved in this browser.</p>
          {saved.length > 0 && (
            <label className="mb-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={awaitingOutreachOnly} className="size-4 accent-primary"
                onChange={event => setAwaitingOutreachOnly(event.target.checked)} />
              Show only facilities I haven’t contacted
            </label>
          )}
          {visibleSaved.length ? (
            <ul className="space-y-2">
              {visibleSaved.map(item => (
                <li key={item.slug} className="flex flex-wrap items-center gap-2">
                  <Link className="break-words text-primary underline" to={{
                    pathname: `/boarding/${encodeURIComponent(item.slug)}`, search: params.toString(),
                  }}>{item.name}</Link>
                  <Button size="sm" variant="ghost" type="button" aria-label={`Remove ${item.name} from shortlist`}
                    onClick={() => update(item, false)}>Remove</Button>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" className="size-4 accent-primary" checked={item.contacted === true}
                      aria-label={`Contacted ${item.name}`}
                      onChange={event => updateContacted(item.slug, event.target.checked)} />
                    Contacted
                  </label>
                  <BoardingShortlistNote facility={item} onSave={note => updateNote(item.slug, note)} />
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="text-sm">
              {saved.length ? 'You’ve contacted every saved facility.' : 'Save a facility from the results to find it here.'}
            </p>
          )}
          {saved.length > 0 && <BoardingShortlistShare facilities={saved} />}
          {saved.length >= 2 && <BoardingComparison facilities={saved} search={params.toString()} />}
        </details>
        {storageError && <p role="alert" className="mt-2 text-sm text-destructive">Could not update your shortlist. Check your browser storage settings.</p>}
        <form className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-4" onSubmit={event => {
          event.preventDefault();
          searchLocation(draftCity, draftState);
        }}>
          <div className="min-w-44 flex-1 space-y-1">
            <Label htmlFor="boarding-city">City</Label>
            <Input id="boarding-city" value={draftCity} maxLength={80} placeholder="Any city"
              onChange={event => setDraftCity(event.target.value)} />
          </div>
          <div className="min-w-44 flex-1 space-y-1">
            <Label htmlFor="boarding-state">State or FCT</Label>
            <NigeriaStatePicker id="boarding-state" value={draftState} emptyLabel="Any state or FCT" autoComplete="off"
              onChange={event => setDraftState(event.target.value)} />
          </div>
          <Button type="submit">Find facilities</Button>
          {(city || state || draftCity || draftState) && <Button type="button" variant="outline" onClick={() => searchLocation('', '')}>Clear filters</Button>}
        </form>
        {(city || state) && <p className="text-sm text-muted-foreground">Boarding facilities in <span className="font-semibold [overflow-wrap:anywhere]">{[city, state].filter(Boolean).join(', ')}</span></p>}
        {listings.isPending && <p role="status">Loading boarding facilities…</p>}
        {listings.isError && <div><p role="alert">Could not load the boarding directory.</p>
          <Button variant="link" onClick={() => void listings.refetch()}>Retry directory</Button></div>}
        {listings.isSuccess && (listings.data.facilities.length === 0
          ? <p>{(city || state) ? 'No listed boarding facilities match these filters.' : 'No boarding facilities are listed yet.'}</p>
          : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Boarding facilities">
            {listings.data.facilities.map(facility => {
              const isSaved = saved.some(item => item.slug === facility.slug);
              return (
                <li key={facility.slug} className="flex min-w-0 flex-col items-start gap-3 rounded-xl border bg-card p-5">
                  <div className="flex w-full items-start justify-between gap-2">
                    <h2 className="min-w-0 break-words text-xl font-semibold">{facility.name}</h2>
                    <Button type="button" variant="outline" size="sm" className="shrink-0"
                      aria-label={`Save ${facility.name} to shortlist`} aria-pressed={isSaved}
                      onClick={() => update(facility, !isSaved)}>
                      <Bookmark aria-hidden="true" className={isSaved ? 'fill-current' : undefined} />
                      {isSaved ? 'Saved' : 'Save'}
                    </Button>
                  </div>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4 shrink-0" aria-hidden="true" />{facility.city}, {facility.state}
                  </p>
                  {facility.description && <p className="whitespace-pre-wrap break-words text-sm">{facility.description}</p>}
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link to={{ pathname: `/boarding/${encodeURIComponent(facility.slug)}`, search: params.toString() }}
                        aria-label={`View ${facility.name}`}>View facility</Link>
                    </Button>
                    <BoardingEmailLink name={facility.name} email={facility.email} />
                  </div>
                </li>
              );
            })}
          </ul>)}
        <div className="flex flex-wrap gap-2">
          {cursor && <Button variant="outline" onClick={() => setPagination({ city, state, pages: pages.slice(0, -1) })}>Previous page</Button>}
          {listings.isSuccess && listings.data.hasMore && last && <Button variant="outline"
            disabled={listings.isFetching} onClick={() => setPagination({ city, state, pages: [...pages, last.slug] })}>Next page</Button>}
        </div>
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5" aria-labelledby="boarding-operator-heading">
          <div className="space-y-1">
            <h2 id="boarding-operator-heading" className="text-lg font-semibold">Run a boarding facility?</h2>
            <p className="text-sm text-muted-foreground">Register your facility and submit it for review. Once approved, you can choose to publish your listing here.</p>
          </div>
          <Button asChild variant="outline"><Link to={boardingRegistrationPath}>Register your boarding facility</Link></Button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
