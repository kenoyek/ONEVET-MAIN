import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Loader2 } from 'lucide-react';

interface SubscriptionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionGate({ children, fallback }: SubscriptionGateProps) {
  const { isActive, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isActive) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-4">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Subscription Required</CardTitle>
          <CardDescription>
            Access to 24/7 vet consultations requires an active subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Subscribe now to get unlimited access to licensed veterinarians, anytime, anywhere.
          </p>
          <Button asChild className="w-full">
            <Link to="/pricing">View Subscription Plans</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
