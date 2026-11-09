import '@/components/landing/welcome.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { CarePathways } from '@/components/landing/CarePathways';
import { SEO } from '@/components/shared/SEO';

export default function Index() {
 return <div className="welcome-home min-h-screen"><SEO /><Navbar /><main id="main-content" tabIndex={-1}><Hero /><CarePathways /></main><Footer /></div>;
}
