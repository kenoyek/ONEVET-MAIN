import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Stethoscope, Store, Scissors, Home } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { providerSignUpSchema, type ProviderSignUpValues } from '@/lib/validation';
import { supabase } from '@/integrations/supabase/client';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ProviderRole = 'veterinarian' | 'service_provider';

const roleOptions: { value: ProviderRole; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'veterinarian',
    label: 'Veterinarian',
    description: 'Provide consultations and medical care',
    icon: <Stethoscope className="h-5 w-5" />,
  },
  {
    value: 'service_provider',
    label: 'Groomer',
    description: 'Offer pet grooming services',
    icon: <Scissors className="h-5 w-5" />,
  },
  {
    value: 'service_provider',
    label: 'Boarding Facility',
    description: 'Provide pet boarding and sitting',
    icon: <Home className="h-5 w-5" />,
  },
  {
    value: 'service_provider',
    label: 'Vendor Store',
    description: 'Sell pet food, accessories, and supplies',
    icon: <Store className="h-5 w-5" />,
  },
];

export function ProviderSignUpForm() {
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');

  const form = useForm<ProviderSignUpValues>({
    resolver: zodResolver(providerSignUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'service_provider',
      businessName: '',
      location: '',
      licenseNumber: '',
    },
  });

  const watchRole = form.watch('role');

  const onSubmit = async (values: ProviderSignUpValues) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(
        values.email,
        values.password,
        values.firstName,
        values.lastName,
        values.role,
        {
          businessName: values.businessName || undefined,
          location: values.location || undefined,
          licenseNumber: values.licenseNumber || undefined,
          specialty: selectedLabel || undefined,
          vendorType: selectedLabel ? selectedLabel.toLowerCase().replace(/\s+/g, '_') : undefined
        }
      );
      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(error.message || 'Failed to create account. Please try again.');
        }
        return;
      }

      toast.success('Account created! Please check your email to verify your account.');
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" autoComplete="given-name" className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" {...field} />
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
                  <Input placeholder="Doe" autoComplete="family-name" className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" {...field} />
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
              <FormLabel className="text-sm font-medium text-foreground">Business Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="dr.smith@clinic.com" autoComplete="email" className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" {...field} />
              </FormControl>
              <FormMessage className="font-bold text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground text-center block mb-4">Professional Category</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(val) => {
                    field.onChange(val);
                  }}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-3"
                >
                  {roleOptions.map((option, idx) => (
                    <div key={`${option.value}-${idx}`}>
                      <RadioGroupItem
                        value={option.value}
                        id={`provider-${idx}`}
                        className="peer sr-only"
                        checked={field.value === option.value && selectedLabel === option.label}
                        onClick={() => {
                          field.onChange(option.value);
                          setSelectedLabel(option.label);
                        }}
                      />
                      <Label
                        htmlFor={`provider-${idx}`}
                        onClick={() => {
                          field.onChange(option.value);
                          setSelectedLabel(option.label);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-2xl border-2 border-muted bg-card p-4 cursor-pointer transition-all text-center h-full",
                          "hover:bg-primary/5 hover:border-primary/20",
                          field.value === option.value && selectedLabel === option.label && "border-primary bg-primary/5 shadow-soft scale-[1.02]"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-xl transition-colors",
                          field.value === option.value && selectedLabel === option.label ? "bg-primary text-white shadow-none" : "bg-primary/10 text-primary"
                        )}>{option.icon}</div>
                        <div className="text-xs font-semibold uppercase tracking-tight">{option.label}</div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage className="font-bold text-xs" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Organization name</FormLabel>
                <FormControl>
                  <Input placeholder="Clinic or Brand Name" className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" {...field} />
                </FormControl>
                <FormMessage className="font-bold text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">City and state</FormLabel>
                <FormControl>
                  <Input placeholder="City, State" className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" {...field} />
                </FormControl>
                <FormMessage className="font-bold text-xs" />
              </FormItem>
            )}
          />
        </div>

        {watchRole === 'veterinarian' && (
          <FormField
            control={form.control}
            name="licenseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">VCN License ID</FormLabel>
                <FormControl>
                  <Input placeholder="VET-XXXX-XXXX" className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" {...field} />
                </FormControl>
                <FormMessage className="font-bold text-xs" />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Password</FormLabel>
                <div className="relative">
                    <FormControl><Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                      {...field}
                    /></FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-primary transition-colors"
                      aria-label={showPassword?'Hide password':'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                      {...field}
                    /></FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-primary transition-colors"
                      aria-label={showConfirmPassword?'Hide confirm password':'Show confirm password'}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                <FormMessage className="font-bold text-xs" />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" size="xl" className="w-full rounded-full font-semibold shadow-none  transition-all" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            'Create provider account'
          )}
        </Button>
      </form>
    </Form>
  );
}
