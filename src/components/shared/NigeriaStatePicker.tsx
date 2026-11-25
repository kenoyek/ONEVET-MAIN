import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

const states = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
  'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
  'Federal Capital Territory',
];

type Props = Omit<ComponentPropsWithoutRef<'select'>, 'children' | 'multiple' | 'value' | 'defaultValue'> & {
  value?: string;
};

export const NigeriaStatePicker = forwardRef<HTMLSelectElement, Props>(function NigeriaStatePicker(
  { value, required, className, ...props }, ref,
) {
  return (
    <select ref={ref} required={required} autoComplete="address-level1" {...props} value={value}
      className={cn('h-12 w-full rounded-xl border border-input bg-card px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 md:text-sm', className)}>
      <option value="">{required ? 'Select a state or FCT' : 'Select a state or FCT (optional)'}</option>
      {value && !states.includes(value) && <option value={value}>{value} (saved location)</option>}
      {states.map(state => (
        <option key={state} value={state}>
          {state === 'Federal Capital Territory' ? 'Federal Capital Territory (FCT)' : state}
        </option>
      ))}
    </select>
  );
});
