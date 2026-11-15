import careImage from '@/assets/marketing/welcome-care-1100.webp';
import smallCareImage from '@/assets/marketing/welcome-care-640.webp';
import farmImage from '@/assets/marketing/welcome-farm-760.webp';
import {PageHeading} from '@/components/layout/PageHeading';
import {Link} from 'react-router-dom';
import {ArrowUpRight, Heart, Sprout, Stethoscope, MapPin, Check} from 'lucide-react';
import {Navbar} from '@/components/layout/Navbar';
import {Footer} from '@/components/layout/Footer';
import {Button} from '@/components/ui/button';
import {SEO} from '@/components/shared/SEO';
import './about.css';

const pathways=[
 {Icon:Heart,title:'For the animals you love',text:'Pet profiles, owner-reported health observations and a clearer route to professional care.',href:'/pet-care',action:'Explore pet care'},
 {Icon:Sprout,title:'For the livelihoods you build',text:'A place for farm records, animal groups and the changes you notice across a herd, flock or pond.',href:'/farm-care',action:'Explore farm care'},
 {Icon:Stethoscope,title:'For the expertise you bring',text:'A private organization workspace, an application for review and tools to manage published services and requests.',href:'/provider/register',action:'Start a provider application'},
];
export default function About(){
 return <div className="about-page bg-background min-h-screen"><SEO title="About 1Vet" description="Based in Ibadan, Oyo State, 1Vet connects pet owners and farmers with veterinary services, animal records and everyday essentials."/><Navbar/>
  <main id="main-content" tabIndex={-1} className="container-wide pt-32 md:pt-40 pb-20">
   <div className="public-intro public-intro-grid"><div><PageHeading size="display" eyebrow="Our purpose" title={<>Care that reaches<br/><em>beyond the clinic.</em></>} description="For the pet curled up beside you. For the animals your livelihood depends on. We’re building a clearer connection between the people who care and the professionals who can help."/><div className="flex flex-wrap gap-3 mt-7"><Button asChild><Link to="/find-a-vet">Find veterinary care<ArrowUpRight size={17} aria-hidden="true"/></Link></Button><Button asChild variant="outline"><Link to="/auth?mode=signup">Create your account</Link></Button></div></div><img className="public-intro-image" src={careImage} srcSet={`${smallCareImage} 640w, ${careImage} 1100w`} sizes="(min-width:1024px) 45vw, 100vw" alt="A veterinarian examining a cat with its owner" width="1100" height="825" fetchPriority="high" decoding="async"/></div>
   <section className="about-purpose" aria-labelledby="about-purpose-heading"><p className="eyebrow">Why we’re here</p><div><h2 id="about-purpose-heading">A little less uncertainty.<br/><em>A more connected kind of care.</em></h2><div><p>Looking after an animal comes with questions. Where do you start? Which provider understands their needs? Where did you keep the details from last time?</p><p>1Vet brings care discovery, animal records, appointment requests and everyday essentials into one place. Our mission is to make veterinary guidance easier to find and animal care easier to keep track of.</p></div></div></section>
   <section className="about-pathways" aria-labelledby="about-pathways-heading"><div className="about-section-title"><p className="eyebrow">Different needs. A shared purpose.</p><h2 id="about-pathways-heading">There’s a place<br/><em>for your kind of care.</em></h2></div><div className="about-pathway-grid">{pathways.map(({Icon,title,text,href,action})=><article key={title}><span className="about-icon"><Icon size={26} strokeWidth={1.5} aria-hidden="true"/></span><h3>{title}</h3><p>{text}</p><Link to={href}>{action}<ArrowUpRight size={17} aria-hidden="true"/></Link></article>)}</div></section>
   <section className="about-approach" aria-labelledby="about-approach-heading"><div className="about-approach-image"><img src={farmImage} alt="Farm animals in a livestock setting" width="760" height="570" loading="lazy" decoding="async"/><p>For a single companion.<br/>For a whole farm.</p></div><div><p className="eyebrow">What guides us</p><h2 id="about-approach-heading">Thoughtful by design.<br/><em>Practical in everyday life.</em></h2><ul>{[
    ['Clarity before commitment','Review provider information and listed fees. Appointment requests need provider confirmation; any additional costs should be agreed before care.'],
    ['A story you can return to','Keep animal profiles and your own observations together, so you can bring useful context to your next care conversation.'],
    ['Professional judgment matters','Online guidance can support care. An examination, testing or treatment in person may still be necessary. For immediate distress, seek an in-person vet.'],
   ].map(([title,text])=><li key={title}><Check size={19} aria-hidden="true"/><div><h3>{title}</h3><p>{text}</p></div></li>)}</ul></div></section>
   <section className="about-home" aria-labelledby="about-home-heading"><span className="about-icon"><MapPin size={28} strokeWidth={1.5} aria-hidden="true"/></span><div><p className="eyebrow">Our home. Our ambition.</p><h2 id="about-home-heading">Based in Ibadan.<br/><em>Built for connection.</em></h2><p>Our headquarters is in Ibadan, Oyo State. We’re working towards more connected animal care across Nigeria. Service coverage, species expertise and availability depend on the provider.</p></div><Link to="/contact" className="about-home-link">Talk to our team<ArrowUpRight size={17} aria-hidden="true"/></Link></section>
   <section className="about-next" aria-labelledby="about-next-heading"><div><p className="eyebrow">Start with what matters to you</p><h2 id="about-next-heading">Their care story<br/><em>starts with you.</em></h2><p>Create an account, explore providers or browse supplies. You don’t need to have every answer to take a first step.</p></div><div className="about-next-actions"><Button asChild size="lg"><Link to="/auth?mode=signup">Join 1Vet<ArrowUpRight size={17} aria-hidden="true"/></Link></Button><Button asChild variant="outline" size="lg"><Link to="/marketplace">Explore the marketplace</Link></Button><Link className="text-sm underline underline-offset-4" to="/contact">A question first? Contact our team.</Link></div></section>
  </main><Footer/>
 </div>;
}
