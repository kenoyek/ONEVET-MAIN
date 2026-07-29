import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const testimonials = [
  {
    name: 'Adaora Okonkwo',
    role: 'Pet Owner',
    location: 'Lagos',
    content: 'I was worried about my dog late at night and the vet on 1vet responded within minutes. Amazing service! They saved me a trip to the emergency clinic.',
    rating: 5,
    initials: 'AO',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop'
  },
  {
    name: 'Emeka Nwachukwu',
    role: 'Livestock Farmer',
    location: 'Enugu',
    content: 'As a poultry farmer, having access to veterinary advice 24/7 has been a game-changer. The vets understand livestock health and provide practical solutions.',
    rating: 5,
    initials: 'EN',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop'
  },
  {
    name: 'Fatima Ibrahim',
    role: 'Pet Owner',
    location: 'Abuja',
    content: 'The grooming service I booked through 1vet was professional and my cat has never looked better. Will definitely use again!',
    rating: 5,
    initials: 'FI',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'
  },
];

export function Testimonials() {
  return (
    <section className="section-padding bg-muted/30 relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold bg-background">
            Community Stories
          </Badge>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
            Trusted by pet owners <span className="text-primary">across Nigeria.</span>
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            Join thousands of happy pet parents and farmers who rely on 1vet for premium animal healthcare.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="h-full glass-card rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                <Quote className="absolute -top-4 -right-4 w-24 h-24 text-primary/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />

                {/* Rating */}
                <div className="flex gap-1 mb-8">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-foreground text-lg italic leading-relaxed mb-10 font-medium flex-grow">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 border-t border-border/40 pt-8">
                  <Avatar className="w-14 h-14 border-4 border-background shadow-soft">
                    <AvatarImage src={testimonial.image} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-extrabold text-foreground tracking-tight">{testimonial.name}</div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {testimonial.role} • {testimonial.location}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
