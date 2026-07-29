import { Link } from 'react-router-dom';
import { Stethoscope, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = {
  services: [
    { label: 'Vet Consultations', href: '/consultations' },
    { label: 'Pet Grooming', href: '/services' },
    { label: 'Pet Sitting', href: '/services' },
    { label: 'Vet Clinics', href: '/services' },
    { label: 'Pet Stores', href: '/marketplace' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Contact', href: '/contact' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Safety', href: '/safety' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'FAQs', href: '/faq' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[hsl(170,30%,10%)] text-[hsl(150,15%,90%)] dark:bg-[hsl(170,25%,5%)]">
      <div className="container-wide section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-primary text-primary-foreground">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="font-display text-2xl font-bold text-[hsl(150,15%,95%)]">
                1<span className="text-secondary">vet</span>
              </span>
            </Link>
            <p className="text-[hsl(150,15%,95%)]/70 mb-6 max-w-sm">
              Your one-stop platform for all pet and livestock health needs. 24/7 access to licensed veterinarians, quality services, and expert care.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-lg bg-[hsl(150,15%,95%)]/10 hover:bg-[hsl(150,15%,95%)]/20 transition-colors text-[hsl(150,15%,95%)]">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-[hsl(150,15%,95%)]/10 hover:bg-[hsl(150,15%,95%)]/20 transition-colors text-[hsl(150,15%,95%)]">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-[hsl(150,15%,95%)]/10 hover:bg-[hsl(150,15%,95%)]/20 transition-colors text-[hsl(150,15%,95%)]">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4 text-[hsl(150,15%,95%)]">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-[hsl(150,15%,95%)]/70 hover:text-[hsl(150,15%,95%)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4 text-[hsl(150,15%,95%)]">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-[hsl(150,15%,95%)]/70 hover:text-[hsl(150,15%,95%)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4 text-[hsl(150,15%,95%)]">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-[hsl(150,15%,95%)]/70">
                <Mail className="w-4 h-4" />
                <span>support@1vet.store</span>
              </li>
              <li className="flex items-center gap-3 text-[hsl(150,15%,95%)]/70">
                <Phone className="w-4 h-4" />
                <span>+234 809 800 0355</span>
              </li>
              <li className="flex items-start gap-3 text-[hsl(150,15%,95%)]/70">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>Port-Harcourt, Rivers State</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Provider CTA */}
        <div className="mt-12 pt-8 border-t border-[hsl(150,15%,95%)]/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-[hsl(150,15%,95%)]/60 text-sm">
              © {new Date().getFullYear()} 1vet. All rights reserved.
            </p>
            <span className="hidden sm:inline text-[hsl(150,15%,95%)]/30">|</span>
            <Link
              to="/auth?mode=signup&role=provider"
              className="text-sm text-secondary hover:text-secondary/80 transition-colors font-medium"
            >
              Are you a Service Provider? Join 1vet
            </Link>
          </div>
          <div className="flex gap-6">
            {footerLinks.support.slice(2, 4).map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm text-[hsl(150,15%,95%)]/60 hover:text-[hsl(150,15%,95%)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
