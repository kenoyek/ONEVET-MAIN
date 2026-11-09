import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
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
  }, [user, role, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h2 className="text-xl font-bold">Verifying authorization...</h2>
        <p className="text-muted-foreground text-sm">Please wait while we establish your secure session.</p>
      </div>
    </div>
  );
}
