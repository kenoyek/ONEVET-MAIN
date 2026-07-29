import React from 'react';
import { Stethoscope, Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page content"
      className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground transition-colors duration-200"
    >
      <div className="flex flex-col items-center gap-6 p-6 max-w-sm text-center">
        {/* ONEVET Branded Icon Container */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
            <Stethoscope className="w-8 h-8 text-primary animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          </div>
          <Loader2 className="absolute -bottom-2 -right-2 w-6 h-6 text-primary animate-spin motion-reduce:animate-none" aria-hidden="true" />
        </div>

        {/* Brand Name & Status Text */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            1Vet<span className="text-primary">.</span>
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            Loading application content...
          </p>
        </div>

        {/* Screen Reader Only Announcement */}
        <span className="sr-only">Please wait, loading ONEVET content.</span>
      </div>
    </div>
  );
}

export default PageLoader;
