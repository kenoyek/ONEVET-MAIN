import type { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  farmSchema,
  batchSchema,
  observationSchema,
  type FarmValues,
  type BatchValues,
  type ObservationValues,
} from '@/lib/farm-validation';
import type { BatchRecord } from '@/integrations/supabase/customer-schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const selectStyle =
  'flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm';
function FormErrors({ messages }: { messages: (string | undefined)[] }) {
  const errors = messages.filter(Boolean);
  return errors.length ? (
    <div role="alert" className="text-sm text-destructive">
      <ul>
        {errors.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  ) : null;
}
function SaveButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}
export function FarmForm({
  onSave,
  pending,
}: {
  onSave: (values: FarmValues) => void;
  pending: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FarmValues>({
    resolver: zodResolver(farmSchema),
    defaultValues: { farm_type: 'poultry' },
  });
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
      <label className="block space-y-2 text-sm font-medium">
        <span>Farm name</span>
        <Input
          autoComplete="organization"
          {...register('farm_name')}
          aria-invalid={!!errors.farm_name}
        />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span>Production type</span>
        <select {...register('farm_type')} className={selectStyle}>
          {[
            ['poultry', 'Poultry'],
            ['cattle', 'Cattle'],
            ['goats_sheep', 'Goats & sheep'],
            ['pigs', 'Pigs'],
            ['aquaculture', 'Aquaculture'],
            ['mixed', 'Mixed farm'],
            ['other', 'Other'],
          ].map(([v, l]) => (
            <option value={v} key={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span>Service location</span>
        <Input
          {...register('location_address')}
          aria-describedby="farm-location-help"
          aria-invalid={!!errors.location_address}
        />
      </label>
      <p id="farm-location-help" className="text-xs text-muted-foreground">
        Use the location a veterinarian would need for a visit.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block space-y-2 text-sm font-medium">
          <span>City or local area</span>
          <Input {...register('city')} aria-invalid={!!errors.city} />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          <span>State</span>
          <Input {...register('state')} aria-invalid={!!errors.state} />
        </label>
      </div>
      <FormErrors messages={Object.values(errors).map((e) => e.message)} />
      <SaveButton pending={pending} label="Save farm" />
    </form>
  );
}
export function BatchForm({
  onSave,
  pending,
}: {
  onSave: (values: BatchValues) => void;
  pending: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof batchSchema>, unknown, BatchValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: { species: 'poultry', head_count: 1 },
  });
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
      <label className="block space-y-2 text-sm font-medium">
        <span>Group name</span>
        <Input
          placeholder="e.g. Layer flock A or Pond 2"
          {...register('housing_unit')}
          aria-invalid={!!errors.housing_unit}
        />
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block space-y-2 text-sm font-medium">
          <span>Species</span>
          <select {...register('species')} className={selectStyle}>
            {['poultry', 'cattle', 'goat', 'sheep', 'pig', 'fish', 'other'].map(
              (s) => (
                <option key={s} value={s}>
                  {s[0]?.toUpperCase()}
                  {s.slice(1)}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="block space-y-2 text-sm font-medium">
          <span>Animal count at registration</span>
          <Input
            type="number"
            min="1"
            step="1"
            {...register('head_count')}
            aria-invalid={!!errors.head_count}
          />
        </label>
      </div>
      <label className="block space-y-2 text-sm font-medium">
        <span>Breed (optional)</span>
        <Input {...register('breed')} />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span>Production stage or purpose (optional)</span>
        <Input placeholder="e.g. Broilers, 4 weeks" {...register('purpose')} />
      </label>
      <FormErrors messages={Object.values(errors).map((e) => e.message)} />
      <SaveButton pending={pending} label="Save animal group" />
    </form>
  );
}
export function ObservationForm({
  batches,
  onSave,
  pending,
}: {
  batches: BatchRecord[];
  onSave: (values: ObservationValues) => void;
  pending: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof observationSchema>, unknown, ObservationValues>({
    resolver: zodResolver(
      observationSchema.refine(
        (v) => {
          const group = batches.find((b) => b.id === v.batch_id);
          return !!group && v.affected_count <= group.head_count;
        },
        {
          message: 'Affected count cannot exceed the registered group size',
          path: ['affected_count'],
        },
      ),
    ),
    defaultValues: {
      batch_id: batches[0]?.id,
      affected_count: 0,
      mortality_count: 0,
    },
  });
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        Record what you noticed. This is an owner observation, not a diagnosis
        or prescription. Contact a veterinarian for clinical advice.
      </p>
      <label className="block space-y-2 text-sm font-medium">
        <span>Animal group</span>
        <select {...register('batch_id')} className={selectStyle}>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.housing_unit || b.batch_code}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span>What did you observe?</span>
        <Textarea
          rows={4}
          {...register('observations')}
          aria-invalid={!!errors.observations}
        />
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block space-y-2 text-sm font-medium">
          <span>Animals affected</span>
          <Input
            type="number"
            min="0"
            step="1"
            {...register('affected_count')}
            aria-invalid={!!errors.affected_count}
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          <span>Deaths observed</span>
          <Input
            type="number"
            min="0"
            step="1"
            {...register('mortality_count')}
            aria-invalid={!!errors.mortality_count}
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Counts describe this observation. They do not automatically change the
        registered group size.
      </p>
      <FormErrors messages={Object.values(errors).map((e) => e.message)} />
      <SaveButton pending={pending} label="Save observation" />
    </form>
  );
}
