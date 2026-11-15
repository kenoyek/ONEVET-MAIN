import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {ArrowUpRight, Check, PawPrint, Stethoscope, CircleHelp} from 'lucide-react';
import {useAuth} from '@/lib/auth-context';
import {supabase} from '@/integrations/supabase/client';
import {Navbar} from '@/components/layout/Navbar';
import {Footer} from '@/components/layout/Footer';
import {SEO} from '@/components/shared/SEO';
import {Button} from '@/components/ui/button';
import {Accordion,AccordionContent,AccordionItem,AccordionTrigger} from '@/components/ui/accordion';
import {membershipPrice,membershipTerm,membershipFeatures} from '@/lib/membership-display';
import './pricing-overview.css';

const questions=[
 ['Is creating an account free?','Yes. You can create an account, add animal profiles and owner-reported observations, and follow appointment requests. Provider care and products have separate costs.'],
 ['Can I pay for a membership now?','Online payments and new membership purchases are currently unavailable. Listed plans are for information only. Contact support to confirm details; no plan is activated by viewing this page or creating an account.'],
 ['Does a booking request confirm an appointment?','No. Check the listed base fee, request a time and wait for the provider’s confirmation. Agree any additional tests, medicines, travel or treatment costs separately before care.'],
 ['Are consultations or emergency services included?','Only benefits explicitly confirmed for a particular service or plan should be treated as included. Provider availability varies. If your animal is in immediate distress, seek in-person veterinary care rather than waiting for an online reply.'],
 ['What if I already have a membership?','Contact support to confirm your current membership status, included benefits, expiry and any cancellation or renewal terms. This page does not change an existing membership.'],
];
export function PricingOverview(){
 const {user}=useAuth();
 const plans=useQuery({queryKey:['public-membership-plans'],queryFn:async()=>{
  const result=await supabase.from('subscription_plans').select('id,name,price,currency,duration_months,description,features').eq('is_active',true).order('price',{ascending:true});
  if(result.error)throw result.error;return result.data??[];
 }});
 return <div className="pricing-overview min-h-screen bg-background"><SEO title="Pricing & account benefits" description="See what a free 1Vet account includes, understand provider fees and review listed membership information. Online payments are currently unavailable."/><Navbar/><main id="main-content" tabIndex={-1} className="container-wide pt-32 pb-20">
  <header className="pricing-overview-header"><p className="eyebrow">Care, with clarity</p><h1>Know your options.<br/><em>Choose your next step.</em></h1><p>A free place for their care story. Provider services priced separately. Clear information before you commit.</p></header>
  <section role="status" className="pricing-payment-status"><CircleHelp size={21} aria-hidden="true"/><div><h2>Online payments are currently unavailable</h2><p>You can explore services, request appointments and build your cart. New membership purchases and online checkout are paused.</p></div></section>
  <section className="pricing-options" aria-label="Account and care costs">
   <article className="pricing-option"><PawPrint size={29} strokeWidth={1.5} aria-hidden="true"/><p className="eyebrow mt-5">Your care workspace</p><h2>A free 1Vet account</h2><p className="pricing-option-price">₦0 <span>to create your account</span></p><ul>{['Pet profiles and farm records','Owner-reported health observations','Appointment requests and provider conversations'].map(text=><li key={text}><Check size={17} aria-hidden="true"/>{text}</li>)}</ul><p className="pricing-option-note">Creating an account does not include paid care, medicines or products.</p><Button asChild><Link to={user?'/profile':'/auth?mode=signup'}>{user?'Open your account':'Create your free account'}<ArrowUpRight size={17} aria-hidden="true"/></Link></Button></article>
   <article className="pricing-option"><Stethoscope size={29} strokeWidth={1.5} aria-hidden="true"/><p className="eyebrow mt-5">Professional care</p><h2>Provider-priced services</h2><p className="pricing-option-price">Listed fees <span>vary by service</span></p><ul>{['Review provider profiles and listed base fees','Choose an animal and an available request time','Confirm the appointment and additional costs with the provider'].map(text=><li key={text}><Check size={17} aria-hidden="true"/>{text}</li>)}</ul><p className="pricing-option-note">A submitted request is pending until the provider confirms it. No online payment is collected.</p><Button asChild variant="outline"><Link to="/provider-marketplace">Explore care services<ArrowUpRight size={17} aria-hidden="true"/></Link></Button></article>
  </section>
  <section className="pricing-memberships" aria-labelledby="listed-plans-heading"><div className="pricing-section-heading"><div><p className="eyebrow">Membership information</p><h2 id="listed-plans-heading">Review the details.<br/><em>Ask before you commit.</em></h2></div><p>These are published plan details, not an offer to activate a membership. Confirm inclusions, limits, eligibility and provider availability with support.</p></div>
   {plans.isPending?<p role="status" className="pricing-plan-state">Loading listed memberships…</p>:plans.isError?<div role="alert" className="pricing-plan-state"><h3>Membership details could not be loaded.</h3><p>Your account and care browsing are still available. Retry before relying on plan information.</p><Button variant="outline" onClick={()=>void plans.refetch()}>Retry memberships</Button></div>:!plans.data.length?<div className="pricing-plan-state"><h3>No memberships are listed right now.</h3><p>You can still use a free account and explore provider services.</p></div>:<div className="pricing-plan-grid">{plans.data.map(plan=><article className="pricing-plan" key={plan.id}><span className="pricing-info-label">Information only · purchases paused</span><h3>{plan.name}</h3>{plan.description&&<p>{plan.description}</p>}<div className="pricing-listed-price">{membershipPrice(plan.price,plan.currency)}<span>{membershipTerm(plan.duration_months)}</span></div><h4>Listed benefits</h4><ul>{membershipFeatures(plan.features).map((text,index)=><li key={index}><Check size={15} aria-hidden="true"/>{text}</li>)}</ul><Button asChild variant="outline"><Link to="/contact">Ask about this membership</Link></Button></article>)}</div>}
  </section>
  <section className="pricing-questions" aria-labelledby="pricing-questions-heading"><div><p className="eyebrow">Good questions. Clear answers.</p><h2 id="pricing-questions-heading">Before you<br/><em>take the next step.</em></h2><Link className="inline-flex gap-2 items-center underline mt-5 text-sm" to="/contact">Talk to our team<ArrowUpRight size={16} aria-hidden="true"/></Link></div><Accordion type="single" collapsible>{questions.map(([question,answer])=><AccordionItem value={question!} key={question}><AccordionTrigger className="text-left">{question}</AccordionTrigger><AccordionContent className="leading-relaxed text-muted-foreground">{answer}</AccordionContent></AccordionItem>)}</Accordion></section>
  <p className="mt-12 text-sm text-muted-foreground">Need urgent treatment? <Link className="underline" to="/urgent-care">Seek in-person veterinary care.</Link></p>
 </main><Footer/></div>;
}
