import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const testimonials = [
  {
    name: 'Adaora Okonkwo',
    role: 'Pet Owner',
    location: 'Lagos',
    content: 'I was worried about my dog late at night and the vet on 1vet responded within minutes. Amazing service! They saved me a trip to the emergency clinic.',
    rating: 5,
    initials: 'AO',
  },
  {
    name: 'Emeka Nwachukwu',
    role: 'Livestock Farmer',
    location: 'Enugu',
    content: 'As a poultry farmer, having access to veterinary advice 24/7 has been a game-changer. The vets understand livestock health and provide practical solutions.',
    rating: 5,
    initials: 'EN',
  },
  {
    name: 'Fatima Ibrahim',
    role: 'Pet Owner',
    location: 'Abuja',
    content: 'The grooming service I booked through 1vet was professional and my cat has never looked better. Will definitely use again!',
    rating: 5,
    initials: 'FI',
  },
];

export function Testimonials() {
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
            Loved by Pet Owners{' '}
            <span className="text-primary">Across Nigeria</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of happy pet owners who trust 1vet for their pet care needs.
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
              className="card-feature relative"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/10" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} • {testimonial.location}
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
