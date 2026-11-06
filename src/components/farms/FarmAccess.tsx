import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { isFeatureEnabled } from '@/lib/feature-flags';
import type { ReactNode } from 'react';
export function FarmAccess({ children }: { children: ReactNode }) {
  if (isFeatureEnabled('customer_farms_enabled')) return <>{children}</>;
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-wide pt-32 pb-16">
        <p className="eyebrow mb-4">Farm & livestock records</p>
        <h1 className="text-3xl md:text-4xl">
          Your farm workspace is being prepared.
        </h1>
        <p className="text-muted-foreground my-6 max-w-xl">
          Farm records are not available on this deployment yet. You can still
          explore veterinary providers for your animals.
        </p>
        <Button asChild>
          <Link to="/find-a-vet">Find veterinary care</Link>
        </Button>
      </main>
    </div>
  );
}
