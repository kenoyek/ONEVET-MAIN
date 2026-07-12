import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="section-padding bg-background relative overflow-hidden">
      <div className="container-wide relative z-10">
        <div className="bg-gradient-premium rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-elevated">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-black rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto relative z-10"
          >
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-primary-foreground mb-8 tracking-tighter leading-tight">
              Ready to give your pet the <span className="text-secondary">best care?</span>
            </h2>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-12 font-medium leading-relaxed">
              Join thousands of pet owners across Nigeria who trust 1vet for instant, professional veterinary care.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" className="bg-white text-primary hover:bg-white/90 font-bold shadow-soft rounded-full px-10 hover:scale-105 transition-all" asChild>
                <Link to="/consultations">
                  <MessageCircle className="w-5 h-5 mr-3" />
                  Get Started for Free
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="border-white/30 text-white hover:bg-white/10 font-bold rounded-full px-10 hover:scale-105 transition-all" asChild>
                <Link to="/auth?mode=signup">
                  Register Account
                  <ArrowRight className="w-5 h-5 ml-3" />
                </Link>
              </Button>
            </div>

            <p className="mt-8 text-sm font-bold text-primary-foreground/60 uppercase tracking-widest">
              Available 24/7 • Licensed Vets • Secure Payments
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
