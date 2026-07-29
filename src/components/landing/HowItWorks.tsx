import { motion } from 'framer-motion';
import { UserPlus, Search, MessageCircle, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Create Your Account',
    description: 'Sign up in seconds with your email. Add your pet profiles to get personalized care.',
  },
  {
    icon: Search,
    step: '02',
    title: 'Choose a Service',
    description: 'Browse our vet consultations, grooming, pet sitting, and other services.',
  },
  {
    icon: MessageCircle,
    step: '03',
    title: 'Connect with Experts',
    description: 'Chat with licensed veterinarians or book appointments with service providers.',
  },
  {
    icon: Star,
    step: '04',
    title: 'Get Quality Care',
    description: 'Receive expert advice and services. Rate and review to help others.',
  },
];

export function HowItWorks() {
  return (
    <section className="section-padding bg-background relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-32 h-32 border-4 border-primary rounded-full" />
        <div className="absolute bottom-1/4 right-10 w-48 h-48 border-4 border-secondary rounded-full" />
      </div>

      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold bg-background">
            Step-by-Step
          </Badge>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
            How <span className="text-gradient-brand">1vet</span> works
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            Experience seamless animal healthcare in four simple stages.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              {/* Connector Line (Desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-14 left-1/2 w-full h-[2px] bg-gradient-to-r from-primary/20 via-border to-transparent z-0 ml-12" />
              )}
              
              <div className="text-center relative z-10">
                <div className="relative inline-flex mb-8">
                  <div className="w-28 h-28 rounded-[2.5rem] bg-card border border-border/50 shadow-soft group-hover:shadow-elevated group-hover:-translate-y-2 transition-all duration-500 flex items-center justify-center">
                    <step.icon className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <span className="absolute -top-3 -right-3 w-10 h-10 rounded-2xl bg-secondary text-secondary-foreground font-display font-black text-xs flex items-center justify-center shadow-soft border-4 border-background">
                    {step.step}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-4 tracking-tight group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed font-medium px-4">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
