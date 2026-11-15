import {Link} from 'react-router-dom';
import {SEO} from '@/components/shared/SEO';
import {PageHeading} from '@/components/layout/PageHeading';
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
import { useEffect, useRef, useState } from "react";

const faqs = [
  {
    question: "How quickly will I get a response?",
    answer: "Response times vary. This form is for account and general support, not clinical emergencies. If your animal is in immediate distress, contact an in-person veterinarian instead of waiting for a reply.",
  },
  {
    question: "How much does a consultation cost?",
    answer: "Check each provider’s listed base fee and confirm any additional charges before care. Membership details are informational while online payments are unavailable.",
  },
  {
    question: "Do you support livestock?",
    answer: "You can keep farm and animal-group records and explore veterinary services. Confirm the provider’s species expertise and availability before requesting care.",
  },
  {
    question: "What areas do you serve?",
    answer: "Search the care directory by city and service type. Coverage, remote options and visit availability depend on the provider; no immediate response is guaranteed.",
  },
  {
    question: "How do I become a vet on 1vet?",
    answer: "Start a provider application, save your organization details and submit the required evidence for review. Registration alone does not grant professional approval or publish services.",
  },
  {
    question: "Is my pet's data secure?",
    answer: "Use your account for animal records and appointment conversations. Share only the details needed for your support question; do not include passwords, payment card details or sensitive medical documents in this form. See our Privacy page for data handling information.",
  },
];

export default function Contact() {
  const { toast } = useToast();
  const sendLock=useRef(false);
  const [submitted,setSubmitted]=useState(false);
  const [sendError,setSendError]=useState('');
  useEffect(()=>{if(submitted)document.getElementById('contact-success-heading')?.focus();},[submitted]);
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
    if(sendLock.current)return;sendLock.current=true;setSendError('');setSubmitted(false);
    setIsSubmitting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("contact-form", {
        body: data,
      });

      if (error || result?.success!==true) throw error || new Error('Submission not acknowledged');

      toast({
        title: "Message sent!",
        description: "Your support message has been received. Response times vary.",
      });
      reset();setSubmitted(true);
    } catch {
      setSendError('We couldn’t confirm your submission. Your message is still here. Retry or email support@1vet.store for help.');
      toast({
        title: "Failed to send message",
        description: "Please try again later or email us directly.",
        variant: "destructive",
      });
    } finally {
      sendLock.current=false;setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Contact & support" description="Get help with your 1Vet account, care options or provider registration. For urgent animal health concerns, seek in-person veterinary care."/><Navbar />

      <main id="main-content" tabIndex={-1}>
      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-36 md:pb-16 relative overflow-hidden">
        <div className="container-wide text-center relative z-10">
          <PageHeading size="display" className="page-heading-center" eyebrow="Contact & support" title={<>How can we <em>help you?</em></>} description="Questions about your account, care options or joining 1Vet? Tell us what you need, and we’ll help you find the next step."/>
        </div>
      </section>

      <section className="container-wide mb-10"><div className="rounded-2xl border bg-card p-5 sm:p-7"><h2 className="text-xl mb-3">Find the right next step</h2><p className="text-sm text-muted-foreground mb-5">For appointment updates, use your request’s conversation. For an emergency, seek in-person care.</p><div className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/my-bookings">Your appointment requests</Link></Button><Button asChild variant="outline"><Link to="/provider-marketplace">Find care services</Link></Button><Button asChild variant="outline"><Link to="/urgent-care">Urgent care guidance</Link></Button></div></div></section>
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
              <Card className="card-elevated p-4 sm:p-8 rounded-3xl">
                <CardHeader className="px-0 pt-0 mb-6">
                  <CardTitle className="text-2xl font-semibold tracking-tight mb-2">Send us a message</CardTitle>
                  <CardDescription className="font-medium text-sm">Share your question and the details we need to help.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  {submitted&&<section className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5"><h3 id="contact-success-heading" tabIndex={-1} className="font-semibold">Your support message has been received</h3><p role="status" className="mt-2 text-sm text-muted-foreground">We have your submission. Response times vary. Check the email address you provided for any follow-up.</p><Button variant="link" className="mt-2 p-0" onClick={()=>setSubmitted(false)}>Write another message</Button></section>}
                  <form noValidate aria-busy={isSubmitting} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <fieldset disabled={isSubmitting} className="space-y-6 min-w-0"><legend className="sr-only">Support message details</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                        <Input id="name" maxLength={100} aria-invalid={!!errors.name} aria-describedby={errors.name?"contact-name-error":undefined} placeholder="John Doe" {...register("name")} className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" />
                        {errors.name && <p id="contact-name-error" className="text-xs font-bold text-destructive mt-1">{errors.name.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                        <Input id="email" maxLength={254} aria-invalid={!!errors.email} aria-describedby={errors.email?"contact-email-error":undefined} type="email" placeholder="john@example.com" {...register("email")} className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" />
                        {errors.email && <p id="contact-email-error" className="text-xs font-bold text-destructive mt-1">{errors.email.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Inquiry Subject</Label>
                      <Input id="subject" maxLength={200} aria-invalid={!!errors.subject} aria-describedby={errors.subject?"contact-subject-error":undefined} placeholder="General Inquiry" {...register("subject")} className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" />
                      {errors.subject && <p id="contact-subject-error" className="text-xs font-bold text-destructive mt-1">{errors.subject.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Your Message</Label>
                      <Textarea
                        id="message" maxLength={1000} aria-invalid={!!errors.message} aria-describedby={errors.message?"contact-message-error":undefined}
                        placeholder="How can we support you today?"
                        rows={6}
                        {...register("message")}
                        className="rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all resize-none"
                      />
                      {errors.message && <p id="contact-message-error" className="text-xs font-bold text-destructive mt-1">{errors.message.message}</p>}
                    </div>

                    <Button type="submit" size="xl" className="w-full rounded-full font-semibold shadow-sm hover:scale-[1.02] transition-all" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Sending…</>
                      ) : (
                        <><Send className="w-5 h-5 mr-3" /> Send message</>
                      )}
                    </Button>
                    </fieldset>
                    {sendError&&<p role="alert" className="text-sm text-destructive">{sendError}</p>}
                    <p className="text-xs leading-relaxed text-muted-foreground">For account and general support. Do not include passwords, payment card details or sensitive documents. <Link className="underline" to="/privacy">Read our privacy notice.</Link></p>
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
                  { icon: Phone, title: "Support line", content: "+234 705 239 8371", link: "tel:+2347052398371" },
                  { icon: Clock, title: "Service Hours", content: "Mon–Fri: 8am – 6pm WAT", link: null },
                ].map((item, i) => (
                  <Card key={i} className="card-elevated p-6 rounded-[2rem]">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{item.title}</h4>
                    {item.link ? (
                      <a href={item.link} className="font-bold text-foreground hover:text-primary transition-colors break-words">{item.content}</a>
                    ) : (
                      <p className="font-bold text-foreground">{item.content}</p>
                    )}
                  </Card>
                ))}
              </div>

              <Card className="rounded-3xl p-6 sm:p-8"><h2 className="text-xl mb-3">Joining as a care provider?</h2><p className="text-sm text-muted-foreground leading-relaxed mb-5">Save your organization, attach evidence and submit for review. Already applied? Return to your organizations to see the current status and requested corrections.</p><div className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/provider/register">Provider registration</Link></Button><Button asChild variant="link"><Link to="/privacy">Privacy & your data</Link></Button></div></Card>
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
                  className="card-elevated rounded-2xl px-6 overflow-hidden"
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

      </main>
      <Footer />
    </div>
  );
}
