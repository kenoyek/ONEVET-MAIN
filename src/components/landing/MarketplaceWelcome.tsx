import { Link } from 'react-router-dom';
import { ArrowUpRight, ShoppingBag, PawPrint, Sprout, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MarketplaceWelcome() {
  return <section aria-labelledby="home-marketplace-heading" className="container-wide py-12 md:py-20">
    <div className="overflow-hidden rounded-[2rem] border bg-card p-6 sm:p-10 lg:p-14">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="welcome-kicker flex items-center gap-2"><ShoppingBag size={18} aria-hidden="true" />The 1Vet marketplace</p>
          <h2 id="home-marketplace-heading" className="mt-4 font-display text-3xl sm:text-4xl leading-tight">Care for them.<br />Find their everyday essentials.</h2>
          <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">Explore pet and farm supplies, compare listed prices and build your cart. Browse freely—no account needed.</p>
          <Button asChild className="mt-7"><Link to="/marketplace">Explore marketplace<ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
          <p className="mt-4 text-xs text-muted-foreground">The catalogue is growing. Online checkout is currently unavailable.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">{[
          { Icon: PawPrint, title: 'For pets', text: 'Food, care and everyday accessories.' },
          { Icon: Sprout, title: 'For farms', text: 'Explore livestock and poultry supplies.' },
          { Icon: Package, title: 'Your shopping list', text: 'Keep items in your cart while you browse.' },
        ].map(({ Icon, title, text }) => <li key={title} className="flex gap-4 rounded-2xl bg-muted/40 p-5"><Icon className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" /><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p></div></li>)}</ul>
      </div>
    </div>
  </section>;
}
