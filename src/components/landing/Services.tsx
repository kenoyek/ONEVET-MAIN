import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, Scissors, Home, Hospital, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

const services = [
  {
    icon: MessageCircle,
    title: '24/7 Vet Consultations',
    description: 'Instant access to licensed veterinarians for medical advice, diagnosis, and triage from your phone.',
    href: '/consultations',
    color: 'bg-primary',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop'
  },
  {
    icon: Scissors,
    title: 'Premium Pet Grooming',
    description: 'Expert grooming services including bathing, styling, and hygiene care to keep your pet looking its best.',
    href: '/services/groomers',
    color: 'bg-secondary',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=2071&auto=format&fit=crop'
  },
  {
    icon: Home,
    title: 'Safe Boarding & Sitting',
    description: 'Vetted boarding facilities and professional sitters providing a safe, loving home away from home.',
    href: '/services/pet-sitting',
    color: 'bg-accent',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=2069&auto=format&fit=crop'
  },
  {
    icon: BookOpen,
    title: 'Pet Health Education',
    description: 'Evidence-based articles and guides on pet nutrition, behavior, and preventive healthcare.',
    href: '/education',
    color: 'bg-info',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=2064&auto=format&fit=crop'
  },
];

export function Services() {
  const { user } = useAuth();

  const getHref = (href: string) => user ? href : '/auth';

  return (
    <section className="section-padding bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2" />

      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold">
            Our Ecosystem
          </Badge>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
            Holistic care for every <span className="text-primary">life stage.</span>
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            Discover a comprehensive suite of veterinary and lifestyle services designed to help your animal companions thrive.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to={getHref(service.href)}
                className="group block h-full bg-card rounded-[2rem] border border-border/50 overflow-hidden hover:shadow-elevated hover:-translate-y-2 transition-all duration-500"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                  <div className={`absolute bottom-4 left-4 p-2 rounded-xl ${service.color} text-white shadow-glow`}>
                    <service.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="font-display text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-medium">
                    {service.description}
                  </p>
                  <div className="flex items-center text-xs font-bold uppercase tracking-wider text-primary group-hover:gap-2 transition-all">
                    Explore Service
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <Button variant="outline" size="lg" className="rounded-full border-2 font-bold px-10 hover:bg-primary hover:text-white transition-all" asChild>
            <Link to="/services">
              Browse All Offerings
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
