import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { signInSchema, type SignInValues } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

interface SignInFormProps {
  onForgotPassword: () => void;
}

export function SignInForm({ onForgotPassword }: SignInFormProps) {
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: SignInValues) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(values.email, values.password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email before signing in.');
        } else {
          toast.error(error.message || 'Failed to sign in. Please try again.');
        }
      } else {
        toast.success('Welcome back!');
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">Email address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                  {...field}
                />
              </FormControl>
              <FormMessage className="font-bold text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center mb-1">
                <FormLabel className="text-sm font-medium text-foreground">Password</FormLabel>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 min-h-11 text-xs font-medium text-primary hover:text-secondary transition-colors"
                  onClick={onForgotPassword}
                >
                  Forgot password?
                </Button>
              </div>
              <div className="relative">
                  <FormControl><Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all pr-12"
                    {...field}
                  /></FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-4 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors"
                    aria-label={showPassword?'Hide password':'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              <FormMessage className="font-bold text-xs" />
            </FormItem>
          )}
        />

        <Button type="submit" size="xl" className="w-full rounded-full font-semibold shadow-none  transition-all" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Verifying...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
    </Form>
  );
}
