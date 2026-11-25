import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useBoardingShortlist } from '@/components/boarding/useBoardingShortlist';
import { BoardingShortlistNote } from '@/components/boarding/BoardingShortlistNote';
import { BoardingEmailLink } from '@/components/boarding/BoardingEmailLink';
import { BoardingInquiryForm } from '@/components/boarding/BoardingInquiryForm';
import { BoardingShareLink } from '@/components/boarding/BoardingShareLink';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { PageHeading } from '@/components/layout/PageHeading';
import { SEO } from '@/components/shared/SEO';
import { Button } from '@/components/ui/button';
import { getBoardingFacility } from '@/lib/services/boarding-directory';

export default function BoardingFacility() {
  const { saved, update, updateContacted, updateNote, storageError } = useBoardingShortlist();
  const { slug = '' } = useParams();
  const { search } = useLocation();
  const facility = useQuery({
    queryKey: ['boarding-directory', 'facility', slug],
    queryFn: () => getBoardingFacility(slug),
    retry: false,
    gcTime: 0,
  });
  const listing = facility.isSuccess ? facility.data : null;
  const mapUrl = listing ? `https://www.google.com/maps/search/?${new URLSearchParams({
    api: '1',
    query: [listing.name, listing.city, listing.state, 'Nigeria'].join(', '),
  })}` : undefined;
  const savedFacility = saved.find(item => item.slug === listing?.slug);

  return (
    <div className="min-h-screen bg-background">
      <SEO title={listing?.name ?? 'Boarding facility'}
        description={listing ? `Contact ${listing.name} in ${listing.city}, ${listing.state} about pet boarding.` : 'Browse approved pet boarding facilities in Nigeria.'} />
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container-wide max-w-4xl space-y-6 pb-20 pt-28">
        <Link to={{ pathname: '/boarding', search }} className="text-sm text-primary underline">Back to boarding directory</Link>
        {facility.isPending && <p role="status">Loading facility…</p>}
        {facility.isError && (
          <div className="rounded-xl border bg-card p-5">
            <p role="alert">Could not load this facility.</p>
            <Button variant="link" onClick={() => void facility.refetch()}>Retry listing</Button>
          </div>
        )}
        {facility.isSuccess && !listing && <PageHeading title="Listing unavailable" description="Browse the boarding directory for other facilities." />}
        {listing && (
          <>
            <PageHeading size="display" eyebrow="Pet boarding" title={listing.name} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-5 shrink-0" aria-hidden="true" />{listing.city}, {listing.state}
              </p>
              <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-4">
                Search Google Maps <ArrowUpRight className="size-4" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => update(listing, !savedFacility)}>
                {savedFacility ? 'Remove from shortlist' : 'Save to shortlist'}
              </Button>
              <BoardingShareLink key={listing.slug} slug={listing.slug} />
            </div>
            {storageError && <p role="alert" className="text-sm text-destructive">Could not update your shortlist. Check your browser storage settings.</p>}
            {listing.description && (
              <section className="space-y-3 rounded-xl border bg-card p-5">
                <h2 className="text-xl font-semibold">About this facility</h2>
                <p className="whitespace-pre-wrap leading-relaxed [overflow-wrap:anywhere]">{listing.description}</p>
              </section>
            )}
            <section className="space-y-3 rounded-xl border bg-card p-5">
              <h2 className="text-xl font-semibold">Ask about a stay</h2>
              <p className="text-sm text-muted-foreground">Contact the facility to confirm its address, available dates, rates, and what your pet needs to bring.</p>
              <BoardingInquiryForm key={listing.slug} name={listing.name} email={listing.email} />
              <BoardingEmailLink name={listing.name} email={listing.email} />
              {savedFacility && (
                <label className="flex w-fit items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4 accent-primary" checked={savedFacility.contacted === true}
                    onChange={event => updateContacted(listing.slug, event.target.checked)} />
                  I’ve contacted this facility
                </label>
              )}
            </section>
            {savedFacility && <BoardingShortlistNote key={savedFacility.slug} facility={savedFacility}
              onSave={note => updateNote(savedFacility.slug, note)} />}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
