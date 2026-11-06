import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
export function CarePreferences() {
  const { user, profile, refreshProfile } = useAuth();
  const [value, setValue] = useState('pet_owner');
  const [saved, setSaved] = useState(false);
  const customerType = profile?.customer_type;
  const profileId = profile?.id;
  useEffect(() => {
    setValue(
      customerType === 'livestock_owner'
        ? 'farm_owner'
        : ['pet_owner', 'farm_owner', 'both'].includes(customerType ?? '')
          ? customerType!
          : 'pet_owner',
    );
    setSaved(false);
  }, [profileId, customerType]);
  const save = useMutation({
    mutationFn: async () => {
      if (!user?.id || profile?.user_id !== user.id)
        throw new Error('Account not available');
      const { data, error } = await supabase
        .from('profiles')
        .update({ customer_type: value })
        .eq('id', profile.id)
        .eq('user_id', user.id)
        .select('id')
        .single();
      if (error || !data) throw error || new Error('Profile not updated');
      await refreshProfile();
    },
  });
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="text-lg mb-2">Make this your space.</h2>
      <p className="text-sm text-muted-foreground mb-4">
        You can care for pets, livestock, or both. This preference does not
        change your account permissions.
      </p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(false);
          save.mutate(undefined, { onSuccess: () => setSaved(true) });
        }}
      >
        <label className="block text-sm space-y-2 flex-1 min-w-40">
          <span>I care for</span>
          <select
            className="h-11 w-full rounded-lg border bg-background px-3"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
          >
            <option value="pet_owner">Pets</option>
            <option value="farm_owner">Farm animals</option>
            <option value="both">Pets and farm animals</option>
          </select>
        </label>
        <Button
          type="submit"
          variant="outline"
          disabled={save.isPending || !profile}
        >
          {save.isPending ? 'Saving…' : 'Save preference'}
        </Button>
      </form>
      {save.isError && (
        <p role="alert" className="text-sm text-destructive mt-3">
          Your preference could not be saved. Please try again.
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-primary mt-3">
          Preference saved.
        </p>
      )}
    </section>
  );
}
