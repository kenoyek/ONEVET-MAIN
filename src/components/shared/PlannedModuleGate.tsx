import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { plannedModulesAvailable } from '@/integrations/supabase/planned-client';
export function PlannedModuleGate({children}:{children:ReactNode}) {
 if(plannedModulesAvailable)return <>{children}</>;
 return <div className="min-h-screen bg-background"><Navbar /><main className="container-wide pt-32 pb-20"><h1 className="text-3xl mb-5">This workspace is not available yet.</h1><p className="text-muted-foreground max-w-lg mb-6">You can explore currently available care options or contact the team for assistance.</p><Button asChild><Link to="/services">Explore care options</Link></Button></main></div>;
}
