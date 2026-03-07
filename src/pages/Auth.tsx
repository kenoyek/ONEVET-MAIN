import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, PawPrint, Briefcase, ArrowLeft } from 'lucide-react';
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

  // Role-based redirect after login
  useEffect(() => {
    if (!loading && user && role && mode !== 'reset') {
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'veterinarian') {
        navigate('/vet-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, role, loading, navigate, mode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero text-primary-foreground p-12 flex-col justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-primary-foreground/20 transition-transform group-hover:scale-105">
              <Stethoscope className="w-7 h-7" />
            </div>
            <span className="font-display text-2xl font-bold">1vet</span>
          </Link>

        <div className="space-y-6">
          <h1 className="font-display text-4xl lg:text-5xl font-bold leading-tight">
            {isProviderFlow ? (
              <>
                Grow Your Practice,
                <br />
                <span className="text-secondary">Join 1vet</span>
              </>
            ) : (
              <>
                Your Pet's Health,
                <br />
                <span className="text-secondary">24/7 Support</span>
              </>
            )}
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            {isProviderFlow
              ? 'Join Nigeria\'s fastest-growing pet care platform. Reach thousands of pet owners looking for quality services.'
              : 'Connect with licensed veterinarians anytime, anywhere. Get expert advice for your pets and livestock with our trusted platform.'}
          </p>

          <div className="flex items-center gap-4 pt-8">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-primary-foreground/20 border-2 border-primary flex items-center justify-center text-sm font-medium"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div>
              <div className="font-semibold">10,000+ Pet Owners</div>
              <div className="text-sm text-primary-foreground/70">Trust 1vet for their pets</div>
            </div>
          </div>
        </div>

        <p className="text-sm text-primary-foreground/60">
          © 2024 1vet. All rights reserved.
        </p>
      </div>

      {/* Right side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="p-2 rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="font-display text-2xl font-bold text-foreground">
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
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-elevated">
                  <CardHeader>
                    <CardTitle className="text-2xl font-display">Reset Password</CardTitle>
                    <CardDescription>Enter your new password</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-elevated">
                  <CardContent className="pt-6">
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
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-elevated">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-display">
                      {mode === 'signin' 
                        ? 'Welcome Back' 
                        : selectedRole === 'provider'
                          ? 'Join as Provider'
                          : selectedRole === 'client'
                            ? 'Create Account'
                            : 'Sign Up'}
                    </CardTitle>
                    <CardDescription>
                      {mode === 'signin'
                        ? 'Sign in to access your account'
                        : selectedRole === 'provider'
                          ? 'Register your business on 1vet'
                          : selectedRole === 'client'
                            ? 'Join thousands of pet owners on 1vet'
                            : 'Choose how you want to use 1vet'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={mode === 'signup' ? 'signup' : 'signin'} onValueChange={(v) => { setMode(v as AuthMode); if (v === 'signin') setSelectedRole(null); }}>
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="signin">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                      </TabsList>
                      <TabsContent value="signin">
                        <SignInForm onForgotPassword={() => setMode('forgot')} />
                      </TabsContent>
                      <TabsContent value="signup">
                        <AnimatePresence mode="wait">
                          {selectedRole === null ? (
                            <motion.div
                              key="role-select"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-4"
                            >
                              <p className="text-center text-sm text-muted-foreground mb-4">
                                How would you like to join 1vet?
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                  type="button"
                                  onClick={() => setSelectedRole('client')}
                                  className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-6 text-center transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  <div className="rounded-full bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
                                    <PawPrint className="h-6 w-6 text-primary" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-foreground">Pet Owner / Farmer</div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Book services, talk to vets, manage pets.
                                    </p>
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedRole('provider')}
                                  className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-6 text-center transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  <div className="rounded-full bg-accent/10 p-3 transition-colors group-hover:bg-accent/20">
                                    <Briefcase className="h-6 w-6 text-accent" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-foreground">Service Provider</div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Vet / Groomer / Boarding / Vendor — Offer services and manage bookings.
                                    </p>
                                  </div>
                                </button>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="signup-form"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedRole(null)}
                                className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <ArrowLeft className="h-4 w-4" />
                                Change role
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

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
