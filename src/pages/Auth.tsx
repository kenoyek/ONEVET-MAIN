import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, PawPrint, Briefcase, ArrowLeft, Loader2 } from 'lucide-react';
import { getAuthReturnPath } from '@/lib/auth-navigation';
import { useAuth } from '@/lib/auth-context';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { ProviderSignUpForm } from '@/components/auth/ProviderSignUpForm';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';
import { NewPasswordForm } from '@/components/auth/NewPasswordForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';
type SelectedRole = null | 'client' | 'provider';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = getAuthReturnPath(location.state);
  const [searchParams] = useSearchParams();
  const { user, role, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);

  const isProviderFlow = searchParams.get('role') === 'provider';

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'reset') {
      setMode('reset');
    } else if (modeParam === 'signup') {
      setMode('signup');
    }
    // If role=provider URL param, skip role selection
    if (searchParams.get('role') === 'provider') {
      setSelectedRole('provider');
    }
  }, [searchParams]);

  // Role-based redirect after login.
  // We redirect as soon as `user` is known — we must NOT wait for `role`
  // because `role` is fetched from a DB table and can be slow or fail.
  // Database permissions are verified by ProtectedRoute before opening a portal.
  useEffect(() => {
    if (!loading && user && mode !== 'reset' && searchParams.get('mode') !== 'reset') {
      // Only database roles determine the portal destination.
      const effectiveRole = role;
      if (returnPath) {
        navigate(returnPath, { replace: true });
      } else if (effectiveRole === 'admin') {
        navigate('/admin');
      } else if (effectiveRole === 'veterinarian') {
        navigate('/vet-dashboard');
      } else {
        // Default: pet_owner / service_provider → /dashboard
        navigate('/dashboard');
      }
    }
  }, [user, loading, role, navigate, mode, returnPath, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh-gradient">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-black text-sm uppercase tracking-widest text-primary">Synchronizing...</p>
        </div>
      </div>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen flex bg-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-premium text-primary-foreground p-16 flex-col justify-between relative overflow-hidden">
          {/* Background patterns */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/4 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black rounded-full blur-3xl -translate-x-1/2" />
          </div>

          <Link to="/" className="flex items-center gap-3 group relative z-10">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-soft">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-3xl font-black tracking-tighter">1vet</span>
          </Link>

        <div className="space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.05] tracking-tighter mb-8">
              {isProviderFlow ? (
                <>
                  Scale your <br />
                  <span className="text-secondary">practice.</span>
                </>
              ) : (
                <>
                  Health care <br />
                  <span className="text-secondary">reimagined.</span>
                </>
              )}
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-md font-medium leading-relaxed">
              {isProviderFlow
                ? 'Apply to join 1Vet and submit your professional details for review.'
                : 'Explore veterinary services and keep your animal’s care connected. Provider availability varies.'}
            </p>
          </motion.div>

          <div className="pt-10 border-t border-white/20">
            <p className="font-semibold text-lg">For pet owners, farmers, and veterinary professionals.</p>
            <p className="text-sm text-primary-foreground/80 mt-2">One place to start your animal’s care journey.</p>
          </div>
        </div>

        <p className="text-xs font-bold text-primary-foreground/40 uppercase tracking-[0.2em] relative z-10">
          © 2026 1Vet
        </p>
      </div>

      {/* Right side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-mesh-gradient">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-12 text-center">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="p-2.5 rounded-2xl bg-primary text-white shadow-glow transition-transform group-hover:scale-110">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="font-display text-2xl font-black tracking-tighter">
                1<span className="text-primary">vet</span>
              </span>
            </Link>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'reset' ? (
              <motion.div
                key="reset"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="glass-card p-4 sm:p-8 rounded-[2.5rem]">
                  <CardHeader className="px-0 pt-0 text-center mb-8">
                    <CardTitle className="text-3xl font-black tracking-tighter">Reset Access</CardTitle>
                    <CardDescription className="font-medium">Enter your new credentials below.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <NewPasswordForm />
                  </CardContent>
                </Card>
              </motion.div>
            ) : mode === 'forgot' ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="glass-card p-4 sm:p-8 rounded-[2.5rem]">
                  <CardContent className="px-0 py-0">
                    <PasswordResetForm onBack={() => setMode('signin')} />
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="glass-card p-4 sm:p-8 rounded-[2.5rem]">
                  <CardHeader className="px-0 pt-0 text-center mb-8">
                    <div className="flex justify-center mb-6">
                       <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">Secure Gateway v2.6</div>
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tighter mb-2">
                      {mode === 'signin' 
                        ? 'Welcome Back' 
                        : selectedRole === 'provider'
                          ? 'Provider Access'
                          : selectedRole === 'client'
                            ? 'Owner Registration'
                            : 'Initialize Account'}
                    </CardTitle>
                    <CardDescription className="font-medium">
                      {mode === 'signin'
                        ? 'Sign in to your professional dashboard.'
                        : selectedRole === 'provider'
                          ? 'Register your facility on 1vet.'
                          : selectedRole === 'client'
                            ? 'Join Nigeria\'s animal health network.'
                            : 'Select your preferred account type.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <Tabs value={mode === 'signup' ? 'signup' : 'signin'} onValueChange={(v) => { setMode(v as AuthMode); if (v === 'signin') setSelectedRole(null); }} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-10 bg-muted/50 p-1.5 h-auto rounded-2xl">
                        <TabsTrigger value="signin" className="rounded-xl font-bold py-2.5 data-[state=active]:shadow-soft">Identity Login</TabsTrigger>
                        <TabsTrigger value="signup" className="rounded-xl font-bold py-2.5 data-[state=active]:shadow-soft">New Account</TabsTrigger>
                      </TabsList>

                      <TabsContent value="signin" className="mt-0 focus-visible:ring-0">
                        <SignInForm onForgotPassword={() => setMode('forgot')} />
                      </TabsContent>

                      <TabsContent value="signup" className="mt-0 focus-visible:ring-0">
                        <AnimatePresence mode="wait">
                          {selectedRole === null ? (
                            <motion.div
                              key="role-select"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-4"
                            >
                              <div className="grid grid-cols-1 gap-4">
                                <button
                                  type="button"
                                  onClick={() => setSelectedRole('client')}
                                  className="group flex items-center gap-5 rounded-3xl border-2 border-border/40 bg-card/50 p-6 text-left transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:shadow-soft"
                                >
                                  <div className="rounded-2xl bg-primary/10 p-4 transition-all duration-500 group-hover:scale-110 group-hover:bg-primary/20 group-hover:rotate-3 shadow-sm">
                                    <PawPrint className="h-7 w-7 text-primary" />
                                  </div>
                                  <div>
                                    <div className="font-black text-foreground tracking-tight">Owner / Farmer</div>
                                    <p className="mt-0.5 text-xs font-medium text-muted-foreground leading-relaxed">
                                      Book services, track health records, and connect with doctors.
                                    </p>
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedRole('provider')}
                                  className="group flex items-center gap-5 rounded-3xl border-2 border-border/40 bg-card/50 p-6 text-left transition-all duration-300 hover:border-accent hover:bg-accent/5 hover:shadow-soft"
                                >
                                  <div className="rounded-2xl bg-accent/10 p-4 transition-all duration-500 group-hover:scale-110 group-hover:bg-accent/20 group-hover:-rotate-3 shadow-sm">
                                    <Briefcase className="h-7 w-7 text-accent" />
                                  </div>
                                  <div>
                                    <div className="font-black text-foreground tracking-tight">Professional Provider</div>
                                    <p className="mt-0.5 text-xs font-medium text-muted-foreground leading-relaxed">
                                      Manage clinic, list services, and handle patient consultations.
                                    </p>
                                  </div>
                                </button>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="signup-form"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.3 }}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedRole(null)}
                                className="mb-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                              >
                                <ArrowLeft className="h-4 w-4" />
                                Return to Role selection
                              </button>
                              {selectedRole === 'provider' ? <ProviderSignUpForm /> : <SignUpForm />}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 text-center space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-4">
              By accessing the 1Vet platform, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Protocol
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Standard
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Auth;
