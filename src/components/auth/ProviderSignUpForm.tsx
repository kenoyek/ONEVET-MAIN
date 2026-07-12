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
        values.role
      );
      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(error.message || 'Failed to create account. Please try again.');
        }
        return;
      }

      // Update profile with business details after signup
      // The profile is created by the handle_new_user trigger
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            business_name: values.businessName || null,
            location: values.location || null,
            license_number: values.licenseNumber || null,
            specialty: selectedLabel || null,
            vendor_type: selectedLabel ? selectedLabel.toLowerCase().replace(/\s+/g, '_') : null,
            verification_status: values.role === 'veterinarian' ? 'pending' : 'approved'
          })
          .eq('user_id', user.id);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" autoComplete="given-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" autoComplete="family-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(val) => {
                    field.onChange(val);
                  }}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-2"
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
                          "flex flex-col items-center gap-1 rounded-lg border-2 border-muted bg-popover p-3 cursor-pointer transition-all text-center",
                          "hover:bg-accent hover:text-accent-foreground",
                          field.value === option.value && selectedLabel === option.label && "border-primary bg-primary/5"
                        )}
                      >
                        <div className="text-primary">{option.icon}</div>
                        <div className="text-sm font-medium">{option.label}</div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input placeholder="Your clinic or business name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Lagos, Nigeria" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchRole === 'veterinarian' && (
          <FormField
            control={form.control}
            name="licenseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Number</FormLabel>
                <FormControl>
                  <Input placeholder="VCN license number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Join as Provider'
          )}
        </Button>
      </form>
    </Form>
  );
}
