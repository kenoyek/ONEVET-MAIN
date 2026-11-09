import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { signUpSchema, type SignUpValues } from '@/lib/validation';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function SignUpForm() {
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'pet_owner',
      customerType: 'pet_owner',
    },
  });

  const onSubmit = async (values: SignUpValues) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(
        values.email,
        values.password,
        values.firstName,
        values.lastName,
        values.role,
        { customerType: values.customerType }
      );
      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else if (error.message.includes('invalid')) {
          toast.error('Please check your email format and try again.');
        } else {
          toast.error(error.message || 'Failed to create account. Please try again.');
        }
      } else {
        toast.success('Account created successfully! Please check your email to verify your account.');
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="customerType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">Account Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="glass-card">
                  <SelectItem value="pet_owner">Pet Owner</SelectItem>
                  <SelectItem value="farm_owner">Farm Owner</SelectItem>
                  <SelectItem value="both">Pets and Farm Animals</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="font-bold text-xs" />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Ken" autoComplete="given-name" className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" {...field} />
                </FormControl>
                <FormMessage className="font-bold text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Okagu" autoComplete="family-name" className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" {...field} />
                </FormControl>
                <FormMessage className="font-bold text-xs" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">Email Address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="name@email.com"
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
              <FormLabel className="text-sm font-medium text-foreground">Password</FormLabel>
              <div className="relative">
                  <FormControl><Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
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

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">Confirm password</FormLabel>
              <div className="relative">
                  <FormControl><Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all pr-12"
                    {...field}
                  /></FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-4 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors"
                    aria-label={showConfirmPassword?'Hide confirm password':'Show confirm password'}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
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
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>
    </Form>
  );
}
