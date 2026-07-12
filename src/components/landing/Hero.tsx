import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, Shield, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stats = [
  { value: '24/7', label: 'Vet Availability' },
  { value: '500+', label: 'Licensed Vets' },
  { value: '50k+', label: 'Happy Pet Owners' },
];

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 md:pt-32 pb-16 overflow-hidden bg-mesh-gradient">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Content */}
      <div className="container-wide relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-8"
            >
              <Shield className="w-4 h-4" />
              Licensed Veterinary Network • Nigeria
            </motion.div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.1] mb-8 tracking-tighter">
              Exceptional care for your <span className="text-gradient-brand">best friend.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Connect with Nigeria's leading veterinarians instantly. Professional healthcare and wellness services for your pets and livestock, right at your fingertips.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button size="xl" className="font-bold shadow-glow hover:scale-105 transition-all rounded-full px-8" asChild>
                <Link to="/consultations/new">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Talk to a Vet Now
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="font-bold border-2 rounded-full px-8 hover:bg-muted/50 transition-all" asChild>
                <Link to="/auth?mode=signup">
                  Explore Services
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-10 md:gap-16 pt-4 border-t border-border/40">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <div className="font-display text-3xl font-extrabold text-foreground tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Image/Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-elevated border-[8px] border-background aspect-[4/5] max-h-[600px]">
              <img
                src="https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=2070&auto=format&fit=crop"
                alt="Veterinarian examining a dog"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
              />
              {/* Floating Cards */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute top-12 -left-12 p-5 rounded-3xl glass-card flex items-center gap-4 animate-bounce-soft"
              >
                <div className="p-3 rounded-2xl bg-success text-success-foreground shadow-glow">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-foreground">Available 24/7</div>
                  <div className="text-xs font-semibold text-muted-foreground">Response in &lt; 5 mins</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="absolute bottom-12 -right-8 p-5 rounded-3xl glass-card flex flex-col gap-3 w-48 shadow-elevated"
              >
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden bg-muted">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Vet" />
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[10px] font-bold text-white">
                    +500
                  </div>
                </div>
                <div className="font-bold text-sm">Verified Doctors</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
}
