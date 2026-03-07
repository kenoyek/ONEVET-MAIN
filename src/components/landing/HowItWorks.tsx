import { motion } from 'framer-motion';
import { UserPlus, Search, MessageCircle, Star } from 'lucide-react';

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
    <section className="section-padding bg-muted">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            How <span className="text-primary">1vet</span> Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Getting expert care for your pet is simple. Follow these easy steps to get started.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-border -translate-x-1/2" />
              )}
              
              <div className="text-center">
                <div className="relative inline-flex mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-card shadow-soft flex items-center justify-center">
                    <step.icon className="w-10 h-10 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-display font-bold text-sm flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
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
