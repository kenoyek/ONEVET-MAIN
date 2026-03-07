import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="section-padding bg-gradient-hero relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-secondary rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Your Pet's Health Can't Wait
          </h2>
          <p className="text-lg sm:text-xl text-primary-foreground/80 mb-8">
            Don't wait for an emergency. Get instant access to licensed veterinarians who can help with any health concern, big or small.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild>
              <Link to="/consultations">
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Free Consultation
              </Link>
            </Button>
            <Button variant="outline-light" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Create Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-primary-foreground/60">
            First consultation is free. No credit card required.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
