import { watDate } from '@/lib/services/appointment-service';
export function bookingDateRange() {
  const today = watDate();
  return { today, last: watDate(new Date(Date.parse(today + 'T12:00:00+01:00') + 90 * 86400000)) };
}
export function initialBookingDate(value: string | null, today: string, last: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < today || value > last) return today;
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : today;
}
