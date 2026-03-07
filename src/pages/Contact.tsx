import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { MapPin, Mail, Phone, Clock, Send, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactValues } from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const faqs = [
  {
    question: "How quickly will I get a response?",
    answer: "We respond to contact form submissions within 24 hours on business days. For urgent pet health concerns, start a vet consultation for instant access to a licensed veterinarian.",
  },
  {
    question: "How much does a consultation cost?",
    answer: "Consultation costs depend on your subscription plan. Visit our Services page for detailed pricing. We offer flexible plans for both pet owners and livestock farmers.",
  },
  {
    question: "Do you support livestock?",
    answer: "Yes! We support cattle, goats, sheep, poultry, pigs, horses, and more. Our veterinarians have expertise in both companion animals and livestock management.",
  },
  {
    question: "What areas do you serve?",
    answer: "We serve all of Nigeria through our online consultation platform. No matter where you are — from Port-Harcourt to Kano — you can connect with a vet instantly.",
  },
  {
    question: "How do I become a vet on 1vet?",
    answer: "Sign up as a veterinarian through our registration page. You'll need to provide your license details for verification. Once approved, you can start accepting consultations.",
  },
  {
    question: "Is my pet's data secure?",
    answer: "Absolutely. All data is encrypted and securely stored. We follow industry best practices to protect your pet's health records and personal information.",
  },
];

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactValues) => {
    setIsSubmitting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("contact-form", {
        body: data,
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });
      reset();
    } catch (err) {
      toast({
        title: "Failed to send message",
        description: "Please try again later or email us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container-wide text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Get in Touch
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Have a question, feedback, or need support? We'd love to hear from you. 
            Reach out and our team will respond within 24 hours.
          </motion.p>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left - Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-2xl">Send us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Your full name" {...register("name")} />
                      {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                      {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="What is this about?" {...register("subject")} />
                      {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us more about your question or concern..."
                        rows={5}
                        {...register("message")}
                      />
                      {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                      ) : (
                        <><Send className="w-4 h-4 mr-2" /> Send Message</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right - Info + Map */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Contact Details */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Our Location</h4>
                      <p className="text-muted-foreground">Port-Harcourt, Rivers State, Nigeria</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Email Us</h4>
                      <a href="mailto:support@1vet.store" className="text-primary hover:underline">support@1vet.store</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Call Us</h4>
                      <a href="tel:+2348098000355" className="text-primary hover:underline">+234 809 800 0355</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Business Hours</h4>
                      <p className="text-muted-foreground">Mon–Fri: 8am – 6pm</p>
                      <p className="text-muted-foreground">Saturday: 9am – 3pm</p>
                      <p className="text-sm text-primary font-medium mt-1">24/7 for emergencies via consultations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Map */}
              <Card className="overflow-hidden">
                <iframe
                  title="1vet Location - Port-Harcourt"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127285.30909700863!2d6.953101!3d4.8156!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1069cea39a4fdd3d%3A0x2f5e7c94e5dca158!2sPort%20Harcourt%2C%20Rivers%20State!5e0!3m2!1sen!2sng!4v1700000000000"
                  width="100%"
                  height="280"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                />
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-muted/30">
        <div className="container-wide max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-lg">
              Find quick answers to common questions about our services.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-lg px-6"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
