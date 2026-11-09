import { PageHeading } from '@/components/layout/PageHeading';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ServerCrash, Home, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function Error500() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <ServerCrash className="w-12 h-12 text-destructive" />
          </div>
          <PageHeading size="workspace" className="mb-4" title={<> 500 - Server Error </>}/>
          <p className="text-muted-foreground text-lg mb-8">
            Oops! Something went wrong on our end. We're working on fixing it.
            Please try again later.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="default" size="lg">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
