import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, Scissors, Home, Hospital, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import vetTeleconsultImage from '@/assets/marketing/vet-teleconsult.jpg';
import petGroomingImage from '@/assets/marketing/pet-grooming.jpg';
import petSittingImage from '@/assets/marketing/pet-sitting.jpg';
import livestockCareImage from '@/assets/marketing/livestock-care.jpg';

const services = [
  {
    icon: MessageCircle,
    title: '24/7 Vet Consultations',
    description: 'Instant access to licensed veterinarians for medical advice, diagnosis, and triage from your phone.',
    href: '/consultations',
    color: 'bg-primary',
    image: vetTeleconsultImage
  },
  {
    icon: Scissors,
    title: 'Premium Pet Grooming',
    description: 'Expert grooming services including bathing, styling, and hygiene care to keep your pet looking its best.',
    href: '/services/groomers',
    color: 'bg-secondary',
    image: petGroomingImage
  },
  {
    icon: Home,
    title: 'Safe Boarding & Sitting',
    description: 'Vetted boarding facilities and professional sitters providing a safe, loving home away from home.',
    href: '/services/pet-sitting',
    color: 'bg-accent',
    image: petSittingImage
  },
  {
    icon: BookOpen,
    title: 'Pet & Livestock Education',
    description: 'Evidence-based articles and guides on pet nutrition, behavior, and preventive livestock healthcare.',
    href: '/education',
    color: 'bg-info',
    image: livestockCareImage
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
                    loading="lazy"
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
