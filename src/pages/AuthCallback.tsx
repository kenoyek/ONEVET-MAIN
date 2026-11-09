import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [linkFailed]=useState(()=>new URLSearchParams(window.location.hash.slice(1)).has('error')||new URLSearchParams(window.location.search).has('error'));
  const { user, role, loading, passwordRecovery, permissionsError } = useAuth();

  useEffect(() => {
    if(linkFailed)return;
    if(passwordRecovery){navigate('/auth?mode=reset',{replace:true});return;}
    if (!loading) {
      if (user) {
        if(role===null&&!permissionsError)return;
        // User is authenticated, redirect based on role
        if (role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (role === 'veterinarian') {
          navigate('/vet-dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        // No user found, redirect to auth page
        navigate('/auth', { replace: true });
      }
    }
  }, [user, role, loading, passwordRecovery, permissionsError, linkFailed, navigate]);

  if(linkFailed)return <main className="min-h-screen flex items-center justify-center bg-background p-6"><section role="alert" className="card-elevated p-8 max-w-md text-center space-y-4"><h1 className="text-2xl">This account link is unavailable</h1><p className="text-sm text-muted-foreground">It may have expired or already been used. Request a new reset link, or return to sign in.</p><Link className="block text-primary underline" to="/auth?mode=recover">Request a new reset link</Link><Link className="block text-primary underline" to="/auth">Back to sign in</Link></section></main>;
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h2 className="text-xl font-bold">Confirming your account…</h2>
        <p className="text-muted-foreground text-sm">Please wait while we check your session.</p>
      </div>
    </div>
  );
}
