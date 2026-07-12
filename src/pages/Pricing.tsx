import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Crown, Loader2, Sparkles, ArrowRight, HelpCircle, CreditCard, UserCheck, Zap } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/lib/auth-context';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration_months: number;
  description: string | null;
  features: unknown;
  is_active: boolean | null;
}

const defaultFeatures = [
  '24/7 access to licensed veterinarians',
  'Unlimited text consultations',
  'Pet health records management',
  'Priority urgent care chat',
  'Prescription guidance',
  'Follow-up consultations',
];

import { usePaystack } from '@/hooks/use-paystack';
import { toast } from 'sonner';

const faqs = [
  {
    q: 'How does the subscription work?',
    a: 'Choose a plan, complete your payment via Paystack, and your account will be activated instantly. You then get 24/7 access to licensed veterinarians and all premium features.',
  },
  {
    q: 'How do I make payment?',
    a: 'We use Paystack for secure payments. You can pay using your debit card, bank transfer, or USSD directly on our platform.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes, you can cancel at any time. Your access remains active until the end of your current billing period.',
  },
  {
    q: 'What happens when my subscription expires?',
    a: 'You will lose access to premium features like vet consultations. You can renew anytime by selecting a plan again.',
  },
  {
    q: 'Is there a free trial?',
    a: 'We occasionally offer trial periods. If available, it will be automatically applied when you sign up.',
  },
  {
    q: 'What\'s included in the consultation?',
    a: 'You get real-time text-based consultations with licensed veterinarians who can provide diagnosis guidance, prescription recommendations, and general pet health advice.',
  },
];

const steps = [
  { icon: CreditCard, title: 'Choose a Plan', desc: 'Pick the monthly or yearly plan that suits you.' },
  { icon: Zap, title: 'Pay Securely', desc: 'Complete your payment instantly via Paystack.' },
  { icon: UserCheck, title: 'Get Activated', desc: 'Your subscription is activated immediately.' },
];

function formatNGN(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
}

export default function Pricing() {
  const { user, profile } = useAuth();
  const { subscription, isActive, loading: subLoading, refetch } = useSubscription();
  const { initializePayment } = usePaystack();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });
      if (data) setPlans(data);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleSubscribe = (plan: Plan) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setIsProcessing(plan.id);

    initializePayment({
      email: user.email!,
      amount: plan.price,
      metadata: {
        plan_id: plan.id,
        user_id: user.id
      },
      onSuccess: async (reference) => {
        try {
          // Call edge function to verify payment and activate subscription
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: {
              reference,
              type: 'subscription',
              plan_id: plan.id
            }
          });

          if (error) throw error;

          toast.success(`Successfully subscribed to ${plan.name}!`);
          await refetch();
        } catch (error: any) {
          console.error('Subscription error:', error);
          toast.error(error.message || 'Payment successful but failed to activate subscription. Please contact support.');
        } finally {
          setIsProcessing(null);
        }
      },
      onClose: () => {
        setIsProcessing(null);
      }
    });
  };

  const yearlyPlan = plans.find(p => p.duration_months >= 12);

  return (
    <div className="min-h-screen bg-background bg-mesh-gradient">
      <Navbar />
      <main className="pt-28 md:pt-32 pb-20">
        {/* Hero */}
        <section className="py-12 text-center">
          <div className="container-wide max-w-3xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="outline" className="mb-6 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold bg-background">
                <Sparkles className="w-3 h-3 mr-2" /> Memberships
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6 tracking-tighter heading-safe">
                Healthcare without <span className="text-gradient-brand">boundaries.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                Unlock 24/7 access to licensed veterinarians and premium pet care features with a flexible membership plan.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Active Subscription Banner */}
        {user && !subLoading && isActive && subscription && (
          <section className="pb-12">
            <div className="container-wide max-w-4xl mx-auto px-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="border-primary/20 bg-primary/5 glass-card overflow-hidden">
                  <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-8 text-center sm:text-left">
                    <div className="p-4 rounded-2xl bg-primary text-white shadow-glow">
                      <Crown className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-black text-foreground tracking-tight mb-1">
                        You're a <span className="text-primary">{(subscription as any).plan?.name || 'Valued'}</span> Member
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        <Badge variant="default" className="rounded-full px-3">{subscription.status}</Badge>
                        {subscription.expires_at && (
                          <span>• Valid until {format(new Date(subscription.expires_at), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="lg" className="rounded-full font-bold border-2" asChild>
                      <Link to="/contact">Manage Account</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </section>
        )}

        {/* Plan Cards */}
        <section className="pb-20">
          <div className="container-wide max-w-5xl mx-auto px-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-10">
                {plans.map((plan, i) => {
                  const isPopular = plan.duration_months >= 12;
                  const features: string[] = Array.isArray(plan.features) ? (plan.features as string[]) : defaultFeatures;

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.15 }}
                    >
                      <Card className={`glass-card relative h-full flex flex-col rounded-[3rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 ${isPopular ? 'border-primary/50 shadow-elevated bg-primary/[0.03]' : 'border-border/50 shadow-soft'}`}>
                        {isPopular && (
                          <div className="absolute top-0 right-0">
                            <div className="bg-primary text-white px-8 py-2 rounded-bl-[2rem] font-black text-[10px] uppercase tracking-widest shadow-soft">
                              Best Value
                            </div>
                          </div>
                        )}
                        <CardHeader className="p-10 pb-6">
                          <CardTitle className="text-2xl font-black tracking-tight mb-2 uppercase tracking-widest text-muted-foreground">{plan.name}</CardTitle>
                          {plan.description && <CardDescription className="text-base font-medium">{plan.description}</CardDescription>}
                          <div className="pt-8">
                            <span className="text-6xl font-black text-foreground tracking-tighter">{formatNGN(plan.price)}</span>
                            <span className="text-muted-foreground font-bold ml-2 uppercase tracking-widest text-xs">
                              / {plan.duration_months >= 12 ? 'year' : 'month'}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="px-10 pb-10 flex-1 flex flex-col">
                          <ul className="space-y-4 mb-10 flex-1">
                            {features.map((feature, fi) => (
                              <li key={fi} className="flex items-start gap-3 text-sm font-bold text-foreground/70">
                                <div className="mt-0.5 p-0.5 rounded-full bg-primary/10 text-primary">
                                  <Check className="h-3.5 w-3.5" />
                                </div>
                                <span>{String(feature)}</span>
                              </li>
                            ))}
                          </ul>
                          {user ? (
                            isActive && subscription?.plan_id === plan.id ? (
                              <Button variant="outline" className="w-full h-14 rounded-full font-black border-2" disabled>
                                Currently Active
                              </Button>
                            ) : (
                              <Button
                                className="w-full h-16 rounded-full font-black text-lg shadow-glow hover:scale-105 transition-all"
                                onClick={() => handleSubscribe(plan)}
                                disabled={isProcessing !== null}
                              >
                                {isProcessing === plan.id ? (
                                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                ) : (
                                  <>
                                    Activate Plan <ArrowRight className="ml-2 h-5 w-5" />
                                  </>
                                )}
                              </Button>
                            )
                          ) : (
                            <Button className="w-full h-16 rounded-full font-black text-lg shadow-glow hover:scale-105 transition-all" asChild>
                              <Link to="/auth?mode=signup">
                                Get Started <ArrowRight className="ml-2 h-5 w-5" />
                              </Link>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-muted/20 relative overflow-hidden">
          <div className="container-wide max-w-5xl mx-auto px-4 text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold">Process</Badge>
              <h2 className="font-display text-4xl font-black text-foreground mb-16 tracking-tight">Simple activation flow.</h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-12">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="flex flex-col items-center group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className="w-20 h-20 rounded-[2rem] bg-card border border-border/50 flex items-center justify-center mb-6 shadow-soft group-hover:shadow-glow group-hover:-translate-y-1 transition-all duration-500">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">{step.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed px-4">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section-padding">
          <div className="container-wide max-w-3xl mx-auto px-4">
            <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold">Support</Badge>
              <h2 className="font-display text-4xl font-black text-foreground mb-4 tracking-tight">Common questions.</h2>
              <p className="text-muted-foreground font-medium">Everything you need to know about our premium memberships.</p>
            </motion.div>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-2xl px-6 overflow-hidden">
                  <AccordionTrigger className="text-left py-6 font-bold text-lg hover:no-underline group">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/5 text-primary group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-colors">
                        <HelpCircle className="h-5 w-5" />
                      </div>
                      {faq.q}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground font-medium pb-6 pl-14 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
