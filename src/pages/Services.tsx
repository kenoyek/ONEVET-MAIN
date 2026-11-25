import {Link} from 'react-router-dom';
import {ArrowUpRight,Stethoscope,Scissors,FlaskConical,HeartHandshake,TriangleAlert,Search,ClipboardList,CalendarCheck,House} from 'lucide-react';
import {Navbar} from '@/components/layout/Navbar';
import {Footer} from '@/components/layout/Footer';
import {SEO} from '@/components/shared/SEO';
import {PageHeading} from '@/components/layout/PageHeading';
import {Button} from '@/components/ui/button';
import {CareFinder} from '@/components/landing/CareFinder';
import {careSearchLink} from '@/lib/care-search';
import '@/components/landing/welcome.css';
import './services.css';

const categories=[
 {category:'veterinary',Icon:Stethoscope,title:'Veterinary care',text:'Explore consultations and listed veterinary services. Check species expertise and whether the provider offers clinic, home or remote care.',action:'Find veterinary services'},
 {category:'grooming',Icon:Scissors,title:'Grooming & wellbeing',text:'Browse coat care and grooming services. Discuss your animal’s needs and confirm the provider’s location and handling requirements.',action:'Explore grooming'},
 {category:'diagnostics',Icon:FlaskConical,title:'Diagnostics & labs',text:'Explore listed diagnostic services. Confirm which tests are appropriate with your veterinarian and check preparation requirements with the provider.',action:'Explore diagnostics'},
 {category:'boarding',Icon:House,title:'Pet boarding',text:'Find approved facilities and ask about availability, requirements, and rates for your pet’s stay.',action:'Explore pet boarding'},
 {category:'training',Icon:HeartHandshake,title:'Training & behaviour',text:'Find listed training services and discuss your goals. Ask about approach, species experience and what each session includes.',action:'Explore training'},
];
export default function Services(){
 return <div className="services-overview welcome-home min-h-screen"><SEO title="Care services" description="Explore veterinary, grooming, diagnostic and training services on 1Vet. Search by city, review listed fees and request care subject to provider confirmation."/><Navbar/><main id="main-content" tabIndex={-1} className="pt-32 pb-20">
  <header className="container-wide services-intro"><PageHeading className="page-heading-center" size="display" eyebrow="For pets. For farms. For everyday care." title={<>The right care.<br/><em>A clearer way to find it.</em></>} description="Different animals need different expertise. Explore services, understand the next step and choose a provider who fits your needs."/><div className="flex flex-wrap justify-center gap-3 mt-7"><Button asChild><a href="#service-categories">Explore service types<ArrowUpRight size={17} aria-hidden="true"/></a></Button><Button asChild variant="outline"><Link to="/my-bookings">Your appointment requests</Link></Button><Button asChild variant="outline"><Link to="/care-chat">Chat with our care team</Link></Button></div></header>
  <CareFinder/>
  <section id="service-categories" className="container-wide services-categories" aria-labelledby="service-categories-heading"><div className="services-section-heading"><div><p className="welcome-kicker">Choose your kind of care</p><h2 id="service-categories-heading">Start with what<br/><em>they need today.</em></h2></div><p>Listings and availability vary by category and city. Browse the directory to see what providers currently offer.</p></div><div className="services-category-grid">{categories.map(({category,Icon,title,text,action})=><article key={category}><span className="services-category-icon"><Icon size={28} strokeWidth={1.5} aria-hidden="true"/></span><h3>{title}</h3><p>{text}</p><Link to={careSearchLink(category,'')}>{action}<ArrowUpRight size={17} aria-hidden="true"/></Link></article>)}</div></section>
  <section className="services-process" aria-labelledby="services-process-heading"><div className="container-wide"><p className="welcome-kicker">Know what happens next</p><h2 id="services-process-heading">From browsing<br/><em>to a care request.</em></h2><ol>{[
   {Icon:Search,title:'Explore your options',text:'Review the provider, service description, listed base fee and delivery mode. You can browse before creating an account.'},
   {Icon:ClipboardList,title:'Bring their details',text:'Sign in and add your pet or an eligible farm group. Choose a listed time and share contact details and relevant notes.'},
   {Icon:CalendarCheck,title:'Wait for confirmation',text:'Your request is pending until the provider confirms it. Follow updates and conversations from your appointments.'},
  ].map(({Icon,title,text},index)=><li key={title}><div><span>0{index+1}</span><Icon size={24} strokeWidth={1.5} aria-hidden="true"/></div><h3>{title}</h3><p>{text}</p></li>)}</ol></div></section>
  <section className="container-wide services-before" aria-labelledby="services-before-heading"><div><p className="welcome-kicker">A little clarity before care</p><h2 id="services-before-heading">A request is a start.<br/><em>Confirmation comes next.</em></h2><p>No online payment is collected. Confirm any additional travel, tests, medicines or treatment costs with the provider before care.</p><Link className="welcome-text-link" to="/pricing">Understand costs & account benefits<ArrowUpRight size={17} aria-hidden="true"/></Link></div><div className="services-owner-paths"><Link to="/pet-care"><h3>Getting started with a pet?</h3><p>Profiles, observations and the first steps in care.</p><span>Explore pet care<ArrowUpRight size={16} aria-hidden="true"/></span></Link><Link to="/farm-care"><h3>Caring for farm animals?</h3><p>Farm records, animal groups and species-appropriate care.</p><span>Explore farm care<ArrowUpRight size={16} aria-hidden="true"/></span></Link></div></section>
  <section className="container-wide services-urgent"><TriangleAlert size={24} aria-hidden="true"/><div><h2>Immediate distress needs in-person care.</h2><p>Do not wait for a directory response or an appointment request. Contact or visit a nearby veterinary clinic.</p></div><Link className="welcome-text-link" to="/urgent-care">Urgent care guidance<ArrowUpRight size={17} aria-hidden="true"/></Link></section>
 </main><Footer/></div>;
}
