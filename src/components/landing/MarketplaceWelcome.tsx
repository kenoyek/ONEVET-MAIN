import { Link } from 'react-router-dom';
import { ArrowUpRight, ShoppingBag, PawPrint, Sprout, Package, HeartPulse } from 'lucide-react';
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
        <ul className="welcome-shop-categories">{[
          {Icon: PawPrint,title:'Food & nutrition',text:'Browse pet food',category:'Pet Food'},
          {Icon: HeartPulse,title:'Health & wellbeing',text:'Explore health supplies',category:'Pet Health'},
          {Icon: Sprout,title:'Farm essentials',text:'Browse livestock supplies',category:'Livestock'},
          {Icon: Package,title:'Everyday accessories',text:'Explore accessories',category:'Accessories'},
        ].map(({Icon,title,text,category})=><li key={category}><Link to={'/marketplace?'+new URLSearchParams({category})}><span className="welcome-shop-category-icon"><Icon size={27} strokeWidth={1.4} aria-hidden="true"/></span><h3>{title}</h3><span className="welcome-shop-category-link">{text}<ArrowUpRight size={16} aria-hidden="true"/></span></Link></li>)}</ul>
      </div>
    </div>
  </section>;
}
