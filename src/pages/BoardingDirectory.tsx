import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeading } from '@/components/layout/PageHeading';
import { SEO } from '@/components/shared/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { listBoardingFacilities } from '@/lib/services/boarding-directory';

export default function BoardingDirectory() {
  const [params, setParams] = useSearchParams();
  const city = (params.get('city') ?? '').trim().slice(0, 80);
  const [draft, setDraft] = useState(city);
  const [pagination, setPagination] = useState<{ city: string; pages: string[] }>({ city, pages: [] });
  const pages = pagination.city === city ? pagination.pages : [];
  const cursor = pages.at(-1);

  useEffect(() => setDraft(city), [city]);

  function searchCity(value: string) {
    const nextCity = value.trim().slice(0, 80);
    setDraft(nextCity);
    setPagination({ city: nextCity, pages: [] });
    if (nextCity === city) return;
    const next = new URLSearchParams(params);
    if (nextCity) next.set('city', nextCity);
    else next.delete('city');
    setParams(next);
  }
  const listings = useQuery({
    queryKey: ['boarding-directory', city, cursor],
    queryFn: () => listBoardingFacilities(city, cursor),
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
        <form className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-4" onSubmit={event => {
          event.preventDefault();
          searchCity(draft);
        }}>
          <div className="min-w-44 flex-1 space-y-1">
            <Label htmlFor="boarding-city">City</Label>
            <Input id="boarding-city" value={draft} maxLength={80} placeholder="Any city"
              onChange={event => setDraft(event.target.value)} />
          </div>
          <Button type="submit">Find facilities</Button>
          {(city || draft) && <Button type="button" variant="outline" onClick={() => searchCity('')}>Clear city</Button>}
        </form>
        {city && <p className="text-sm text-muted-foreground">Boarding facilities in <span className="font-semibold [overflow-wrap:anywhere]">{city}</span></p>}
        {listings.isPending && <p role="status">Loading boarding facilities…</p>}
        {listings.isError && <div><p role="alert">Could not load the boarding directory.</p>
          <Button variant="link" onClick={() => void listings.refetch()}>Retry directory</Button></div>}
        {listings.isSuccess && (listings.data.facilities.length === 0
          ? <p>{city ? 'No listed boarding facilities match this city.' : 'No boarding facilities are listed yet.'}</p>
          : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Boarding facilities">
            {listings.data.facilities.map(facility => (
              <li key={facility.slug} className="flex min-w-0 flex-col items-start gap-3 rounded-xl border bg-card p-5">
                <h2 className="break-words text-xl font-semibold">{facility.name}</h2>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4 shrink-0" aria-hidden="true" />{facility.city}, {facility.state}
                </p>
                {facility.description && <p className="whitespace-pre-wrap break-words text-sm">{facility.description}</p>}
                <Button asChild variant="outline" size="sm" className="mt-auto">
                  <a href={`mailto:${encodeURIComponent(facility.email).replace(/%40/g, '@')}`}
                    aria-label={`Email ${facility.name}`}><Mail aria-hidden="true" />Email facility</a>
                </Button>
              </li>
            ))}
          </ul>)}
        <div className="flex flex-wrap gap-2">
          {cursor && <Button variant="outline" onClick={() => setPagination({ city, pages: pages.slice(0, -1) })}>Previous page</Button>}
          {listings.isSuccess && listings.data.hasMore && last && <Button variant="outline"
            disabled={listings.isFetching} onClick={() => setPagination({ city, pages: [...pages, last.slug] })}>Next page</Button>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
