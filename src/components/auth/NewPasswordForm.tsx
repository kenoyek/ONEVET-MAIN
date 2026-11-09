import {useAuth} from '@/lib/auth-context';
import {Link} from 'react-router-dom';
import {authErrorMessage} from '@/lib/auth-feedback';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Lock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { newPasswordSchema, type NewPasswordValues } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { toast } from 'sonner';

export function NewPasswordForm() {
  const navigate = useNavigate();
  const {user,completePasswordRecovery}=useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const busy=useRef(false);
  const [submitError,setSubmitError]=useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: NewPasswordValues) => {
    if(busy.current)return;busy.current=true;setSubmitError('');
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });
      
      if(error){setSubmitError(authErrorMessage(error,'password'));}else{setIsSuccess(true);form.reset();}
    } catch {
      setSubmitError(authErrorMessage(null,'password'));
    } finally {
      busy.current=false;setIsLoading(false);
    }
  };

  if(!user)return <section className="space-y-4 text-center"><h2 className="text-xl">Open your password-reset link</h2><p className="text-sm text-muted-foreground">This page needs a valid reset session. If your link expired, request a new one.</p><Button asChild><Link to="/auth?mode=recover">Request a new reset link</Link></Button></section>;
  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-success" />
        </div>
        <h3 className="text-lg font-semibold">Password updated!</h3>
        <p className="text-muted-foreground">
          Your new password is ready. Continue when you’re ready to return to your account.
        </p><Button className="w-full" onClick={()=>{completePasswordRecovery();navigate('/auth',{replace:true});}}>Continue to your account</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-center">Set new password</h3>
        <p className="text-sm text-muted-foreground text-center">
          Please enter your new password below.
        </p>
      </div>

      <Form {...form}>
        <form noValidate aria-busy={isLoading} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><fieldset disabled={isLoading} className="space-y-5 min-w-0">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <div className="relative">
                    <FormControl><Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="pr-14"
                      {...field}
                    /></FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      aria-label={showPassword?'Hide password':'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                <FormDescription>At least 8 characters, with uppercase and lowercase letters and a number.</FormDescription>
              <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <div className="relative">
                    <FormControl><Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="pr-14"
                      {...field}
                    /></FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      aria-label={showConfirmPassword?'Hide confirm password':'Show confirm password'}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
          </fieldset>{submitError&&<p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{submitError}</p>}
      </form>
      </Form>
    </div>
  );
}
