import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/auth',
}: ProtectedRouteProps) {
  const { user, role, roles, loading, permissionsError, refreshProfile } =
    useAuth();
  const location = useLocation();

  // 1. Wait for Auth metadata (Vite/Supabase session)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  // 2. No user? Send to login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && permissionsError) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <section role="alert" className="max-w-md text-center">
          <h1 className="text-2xl mb-4">
            We couldn’t verify your account access.
          </h1>
          <p className="text-muted-foreground mb-6">
            Please try again. Your account permissions must be confirmed before
            these records can be opened.
          </p>
          <Button onClick={() => refreshProfile()}>Try again</Button>
          <a
            href="/contact"
            className="block mt-4 text-sm underline underline-offset-4"
          >
            Contact support
          </a>
        </section>
      </main>
    );
  }

  // 3. User exists but Role is still fetching from DB? Wait for it.
  // This prevents redirect loops while database queries are in flight.
  if (allowedRoles && role === null && (!roles || roles.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">
            Verifying Permissions...
          </p>
        </div>
      </div>
    );
  }

  // 4. Role exists but is not allowed? Check if any of the user's active roles match
  const hasAccess = allowedRoles
    ? allowedRoles.some(
        (allowed) => role === allowed || (roles && roles.includes(allowed)),
      )
    : true;

  if (allowedRoles && !hasAccess) {
    const dashboardPath =
      role === 'admin' || (roles && roles.includes('admin'))
        ? '/admin'
        : role === 'veterinarian' || (roles && roles.includes('veterinarian'))
          ? '/vet-dashboard'
          : '/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}
