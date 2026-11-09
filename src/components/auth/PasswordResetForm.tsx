import {authErrorMessage} from '@/lib/auth-feedback';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { passwordResetSchema, type PasswordResetValues } from '@/lib/validation';
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

interface PasswordResetFormProps {
  onBack: () => void;
}

export function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const busy=useRef(false);
  const [submitError,setSubmitError]=useState('');
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: PasswordResetValues) => {
    if(busy.current)return;busy.current=true;setSubmitError('');
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      
      if(error){setSubmitError(authErrorMessage(error,'reset'));}else{setEmailSent(true);}
    } catch {
      setSubmitError(authErrorMessage(null,'reset'));
    } finally {
      busy.current=false;setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-success" />
        </div>
        <h3 className="text-lg font-semibold">Check your email</h3>
        <p className="text-muted-foreground">
          If an account exists for this email, you’ll receive a reset link at{' '}
          <span className="font-medium text-foreground">{form.getValues('email')}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Didn't receive the email? Check your spam folder or{' '}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => {setEmailSent(false);setSubmitError('');}}
          >
            request another link
          </button>
        </p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="px-0 text-muted-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to sign in
      </Button>

      <div className="space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-center">Reset your password</h3>
        <p className="text-sm text-muted-foreground text-center">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <Form {...form}>
        <form noValidate aria-busy={isLoading} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><fieldset disabled={isLoading} className="space-y-5 min-w-0">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email" inputMode="email" autoCapitalize="none" spellCheck={false}
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
          </fieldset>{submitError&&<p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{submitError}</p>}
      </form>
      </Form>
    </div>
  );
}
