import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen bg-background bg-mesh-gradient">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden liquid-bg">
        <div className="container-wide text-center relative z-10">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold bg-background">
            Contact Us
          </Badge>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black text-foreground mb-6 tracking-tighter heading-safe"
          >
            How can we <span className="text-gradient-brand">help you?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium"
          >
            Whether you're a pet owner with questions or a veterinarian looking to join our network, our team is here for you.
          </motion.p>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="section-padding pt-0">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left - Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Card className="glass-card p-4 sm:p-8 rounded-[2.5rem]">
                <CardHeader className="px-0 pt-0 mb-6">
                  <CardTitle className="text-2xl font-black tracking-tight mb-2">Send a Secure Message</CardTitle>
                  <CardDescription className="font-medium text-sm">We typically respond within 24 business hours.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                        <Input id="name" placeholder="John Doe" {...register("name")} className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" />
                        {errors.name && <p className="text-xs font-bold text-destructive mt-1">{errors.name.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                        <Input id="email" type="email" placeholder="john@example.com" {...register("email")} className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" />
                        {errors.email && <p className="text-xs font-bold text-destructive mt-1">{errors.email.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Inquiry Subject</Label>
                      <Input id="subject" placeholder="General Inquiry" {...register("subject")} className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" />
                      {errors.subject && <p className="text-xs font-bold text-destructive mt-1">{errors.subject.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Your Message</Label>
                      <Textarea
                        id="message"
                        placeholder="How can we support you today?"
                        rows={6}
                        {...register("message")}
                        className="rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all resize-none"
                      />
                      {errors.message && <p className="text-xs font-bold text-destructive mt-1">{errors.message.message}</p>}
                    </div>

                    <Button type="submit" size="xl" className="w-full rounded-full font-black shadow-glow hover:scale-[1.02] transition-all" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Processing...</>
                      ) : (
                        <><Send className="w-5 h-5 mr-3" /> Transmit Message</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right - Info + Map */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="space-y-8"
            >
              {/* Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: MapPin, title: "HQ Location", content: "Port-Harcourt, Rivers State", link: null },
                  { icon: Mail, title: "Official Email", content: "support@1vet.store", link: "mailto:support@1vet.store" },
                  { icon: Phone, title: "Support line", content: "+234 809 800 0355", link: "tel:+2348098000355" },
                  { icon: Clock, title: "Service Hours", content: "Mon–Fri: 8am – 6pm", link: null },
                ].map((item, i) => (
                  <Card key={i} className="glass-card p-6 rounded-[2rem]">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{item.title}</h4>
                    {item.link ? (
                      <a href={item.link} className="font-bold text-foreground hover:text-primary transition-colors">{item.content}</a>
                    ) : (
                      <p className="font-bold text-foreground">{item.content}</p>
                    )}
                  </Card>
                ))}
              </div>

              {/* Map */}
              <Card className="overflow-hidden rounded-[2.5rem] border-8 border-background shadow-elevated h-[320px]">
                <iframe
                  title="1vet Location - Port-Harcourt"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127285.30909700863!2d6.953101!3d4.8156!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1069cea39a4fdd3d%3A0x2f5e7c94e5dca158!2sPort%20Harcourt%2C%20Rivers%20State!5e0!3m2!1sen!2sng!4v1700000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
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
                  className="glass-card rounded-2xl px-6 overflow-hidden"
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
