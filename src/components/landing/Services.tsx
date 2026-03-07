import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, Scissors, Home, Hospital, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

const services = [
  {
    icon: MessageCircle,
    title: '24/7 Vet Chat',
    description: 'Chat with licensed veterinarians 24/7. Get instant advice for your pet\'s health concerns.',
    href: '/consultations',
    color: 'bg-primary',
  },
  {
    icon: Scissors,
    title: 'Pet Grooming',
    description: 'Professional grooming services to keep your furry friends looking and feeling their best.',
    href: '/services/groomers',
    color: 'bg-secondary',
  },
  {
    icon: Home,
    title: 'Boarding',
    description: 'Trusted pet sitters to care for your pets when you\'re away. Home visits or boarding.',
    href: '/services/pet-sitting',
    color: 'bg-accent',
  },
  {
    icon: BookOpen,
    title: 'Education',
    description: 'Learn about pet care, nutrition, and health with our expert guides and articles.',
    href: '/education',
    color: 'bg-warning',
  },
];

export function Services() {
  const { user } = useAuth();

  const getHref = (href: string) => user ? href : '/auth';

  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything Your Pet Needs,{' '}
            <span className="text-primary">One Platform</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From urgent vet consultations to grooming appointments, we've got all your pet care needs covered.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
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
                className="group block card-interactive p-6 h-full"
              >
                <div className={`inline-flex p-3 rounded-xl ${service.color} text-white mb-4 transition-transform group-hover:scale-110`}>
                  <service.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {service.description}
                </p>
                <span className="inline-flex items-center text-sm font-medium text-primary">
                  Learn more
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Button size="lg" asChild>
            <Link to="/services">
              View All Services
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
