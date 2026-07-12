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
          // Calculate expiration date
          const expires_at = new Date();
          expires_at.setMonth(expires_at.getMonth() + plan.duration_months);

          // Update or create subscription
          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: user.id,
              plan_id: plan.id,
              status: 'active',
              starts_at: new Date().toISOString(),
              expires_at: expires_at.toISOString(),
              updated_at: new Date().toISOString()
            });

          if (error) throw error;

          toast.success(`Successfully subscribed to ${plan.name}!`);
          await refetch();
        } catch (error) {
          console.error('Subscription error:', error);
          toast.error('Payment successful but failed to activate subscription. Please contact support.');
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 md:py-24 text-center">
          <div className="container-wide max-w-3xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                <Sparkles className="w-3 h-3 mr-1" /> Premium Plans
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Choose Your Plan
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Unlock 24/7 access to licensed veterinarians and premium pet care features with a plan that fits your needs.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Active Subscription Banner */}
        {user && !subLoading && isActive && subscription && (
          <section className="pb-8">
            <div className="container-wide max-w-3xl mx-auto px-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        You're on the <span className="text-primary">{(subscription as any).plan?.name || 'Active'}</span> plan
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: <Badge variant="secondary" className="ml-1 capitalize">{subscription.status}</Badge>
                        {subscription.expires_at && (
                          <span className="ml-2">· Expires {format(new Date(subscription.expires_at), 'MMM d, yyyy')}</span>
                        )}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/contact">Manage via Support</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </section>
        )}

        {/* Plan Cards */}
        <section className="pb-16 md:pb-24">
          <div className="container-wide max-w-4xl mx-auto px-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                {plans.map((plan, i) => {
                  const isPopular = plan.id === yearlyPlan?.id;
                  const features: string[] = Array.isArray(plan.features) ? (plan.features as string[]) : defaultFeatures;

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.15 }}
                    >
                      <Card className={`relative h-full flex flex-col ${isPopular ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''}`}>
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge className="bg-primary text-primary-foreground px-4 py-1">
                              <Sparkles className="w-3 h-3 mr-1" /> Best Value
                            </Badge>
                          </div>
                        )}
                        <CardHeader className="text-center pb-2">
                          <CardTitle className="text-xl font-display">{plan.name}</CardTitle>
                          {plan.description && <CardDescription>{plan.description}</CardDescription>}
                          <div className="pt-4">
                            <span className="text-4xl font-bold text-foreground">{formatNGN(plan.price)}</span>
                            <span className="text-muted-foreground ml-1">
                              /{plan.duration_months >= 12 ? 'year' : 'month'}
                            </span>
                          </div>
                          {isPopular && (
                            <p className="text-sm text-primary font-medium mt-1">Save 2 months free!</p>
                          )}
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                          <ul className="space-y-3 mb-8 flex-1">
                            {features.map((feature, fi) => (
                              <li key={fi} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <span>{String(feature)}</span>
                              </li>
                            ))}
                          </ul>
                          {user ? (
                            isActive && subscription?.plan_id === plan.id ? (
                              <Button variant="outline" className="w-full" disabled>
                                Current Plan Active
                              </Button>
                            ) : (
                              <Button
                                className="w-full group"
                                onClick={() => handleSubscribe(plan)}
                                disabled={isProcessing !== null}
                              >
                                {isProcessing === plan.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    Subscribe Now <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                  </>
                                )}
                              </Button>
                            )
                          ) : (
                            <Button className="w-full group" asChild>
                              <Link to="/auth?mode=signup">
                                Get Started <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container-wide max-w-4xl mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-display text-3xl font-bold text-foreground mb-12">How It Works</h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24">
          <div className="container-wide max-w-2xl mx-auto px-4">
            <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-display text-3xl font-bold text-foreground mb-2">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Everything you need to know about our plans</p>
            </motion.div>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                      {faq.q}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pl-6">
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
