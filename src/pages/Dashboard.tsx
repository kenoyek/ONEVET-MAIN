import { Link } from 'react-router-dom';
import {
  PawPrint,
  Sprout,
  MessageCircle,
  ArrowUpRight,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCustomerOverview } from '@/hooks/useCustomerOverview';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { CarePreferences } from '@/components/farms/CarePreferences';
import { isFeatureEnabled } from '@/lib/feature-flags';

export default function Dashboard() {
  const { profile } = useAuth();
  const query = useCustomerOverview();
  const data = query.data;
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="container-wide pt-28 md:pt-36 pb-20"
      >
        <header className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end mb-10">
          <div>
            <p className="eyebrow mb-3">Your care workspace</p>
            <h1 className="text-3xl md:text-4xl">
              Welcome back{profile?.first_name ? `, ${profile.first_name}` : ''}
              .
            </h1>
            <p className="text-muted-foreground mt-3">
              A little more clarity for the animals in your care.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/find-a-vet">
              <MessageCircle size={18} />
              Find a veterinarian
            </Link>
          </Button>
        </header>
        <Button asChild variant="outline" className="mb-6"><Link to="/my-bookings">Your appointment requests</Link></Button>
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <Link className="care-path" to="/pets">
            <PawPrint className="text-primary mb-5" />
            <h2 className="text-xl">Your pets</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Profiles, health history, and everyday care.
            </p>
            <span className="inline-flex gap-2 items-center mt-5 text-primary text-sm font-semibold">
              Open pet profiles <ArrowUpRight size={16} />
            </span>
          </Link>
          <Link
            className="care-path"
            to={
              isFeatureEnabled('customer_farms_enabled')
                ? '/farms'
                : '/farm-care'
            }
          >
            <Sprout className="text-primary mb-5" />
            <h2 className="text-xl">Your farm & livestock</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {isFeatureEnabled('customer_farms_enabled')
                ? 'Keep farms, animal groups, and health observations together.'
                : 'Explore care for your herd, flock, or pond.'}
            </p>
            <span className="inline-flex gap-2 items-center mt-5 text-primary text-sm font-semibold">
              {isFeatureEnabled('customer_farms_enabled')
                ? 'Open farm records'
                : 'Explore farm care'}{' '}
              <ArrowUpRight size={16} />
            </span>
          </Link>
        </div>
        {!profile || query.isLoading ? (
          <p role="status" className="py-8">
            Loading your care overview…
          </p>
        ) : query.isError ? (
          <section role="alert" className="care-path mb-8">
            <h2 className="text-xl mb-3">
              We couldn’t load your care overview.
            </h2>
            <p className="text-muted-foreground mb-4">
              Your account is available, but these records could not be
              retrieved. Try again before starting a new request.
            </p>
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          </section>
        ) : (
          data && (
            <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 mb-8">
              <section className="rounded-2xl border bg-card p-6">
                <div className="flex justify-between items-center gap-3 mb-6">
                  <h2 className="text-xl">Recent consultations</h2>
                  <Link
                    className="text-sm underline underline-offset-4"
                    to="/consultations"
                  >
                    View all
                  </Link>
                </div>
                {!data.consultations.length ? (
                  <div className="py-6">
                    <MessageCircle className="text-primary mb-4" />
                    <h3 className="text-lg mb-2">
                      Your care conversations start here.
                    </h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      When you request a consultation, you can return to it from
                      this workspace.
                    </p>
                    <Button asChild variant="outline">
                      <Link to="/consultations/new">
                        Request a consultation
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {data.consultations.map((c) => (
                      <li key={c.id}>
                        <Link
                          className="block py-4"
                          to={`/consultations/${c.id}`}
                        >
                          <p className="font-semibold break-words">
                            {c.chief_complaint}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground capitalize">
                            {c.status.replaceAll('_', ' ')} ·{' '}
                            {new Intl.DateTimeFormat('en-NG', {
                              dateStyle: 'medium',
                              timeZone: 'Africa/Lagos',
                            }).format(new Date(c.created_at))}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <div className="space-y-6">
                <section className="rounded-2xl border bg-card p-6">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl">Recently added pets</h2>
                    <Link
                      to="/pets/new"
                      aria-label="Add a pet"
                      className="p-2 rounded-lg hover:bg-muted"
                    >
                      <Plus size={19} />
                    </Link>
                  </div>
                  {!data.pets.length ? (
                    <p className="text-sm text-muted-foreground">
                      No pet profiles yet.{' '}
                      <Link
                        to="/pets/new"
                        className="underline underline-offset-4"
                      >
                        Add your first pet.
                      </Link>
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {data.pets.map((p) => (
                        <li key={p.id}>
                          <Link
                            className="flex gap-3 items-center rounded-lg p-2 hover:bg-muted"
                            to={`/pets/${p.id}`}
                          >
                            <PawPrint className="text-primary" size={20} />
                            <span>
                              <span className="font-medium block">
                                {p.name}
                              </span>
                              <span className="text-xs text-muted-foreground capitalize">
                                {p.species}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                <section className="rounded-2xl border bg-card p-6">
                  <h2 className="text-lg mb-3">Membership</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {data.subscription
                      ? `Current status: ${data.subscription.status}.`
                      : 'No membership found.'}{' '}
                    Provider availability must be confirmed separately.
                  </p>
                  <Link
                    to="/pricing"
                    className="text-sm underline underline-offset-4"
                  >
                    Review plans and inclusions
                  </Link>
                </section>
              </div>
              <section className="rounded-2xl border bg-card p-6 lg:col-span-2">
                <div className="flex gap-2 items-center mb-4">
                  <ShoppingBag size={20} className="text-primary" />
                  <h2 className="text-xl">Recent orders</h2>
                </div>
                {!data.orders.length ? (
                  <p className="text-sm text-muted-foreground">
                    No orders to display.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {data.orders.map((o) => (
                      <li
                        key={o.id}
                        className="py-3 flex flex-wrap gap-3 justify-between"
                      >
                        <span className="text-sm text-muted-foreground">
                          {new Intl.DateTimeFormat('en-NG', {
                            dateStyle: 'medium',
                            timeZone: 'Africa/Lagos',
                          }).format(new Date(o.created_at))}{' '}
                          · <span className="capitalize">{o.status}</span>
                        </span>
                        <span className="text-sm">
                          ₦{Number(o.total_amount).toLocaleString('en-NG')} ·
                          Payment: {o.payment_status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )
        )}
        <CarePreferences />
        <p className="text-sm text-muted-foreground mt-8">
          Need urgent treatment?{' '}
          <Link to="/urgent-care" className="underline underline-offset-4">
            Seek in-person veterinary care.
          </Link>
        </p>
      </main>
    </div>
  );
}
