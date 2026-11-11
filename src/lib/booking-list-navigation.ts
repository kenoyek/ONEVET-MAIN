import type { BookingView } from '@/lib/services/appointment-service';
const views: BookingView[] = ['upcoming','needs_response','past_open','history','all'];
export function bookingListFilters(params: URLSearchParams, provider = false) {
  const key = provider ? 'booking_' : '';
  const rawView = params.get(key + 'view') as BookingView | null;
  const rawPage = params.get(key + 'page') || '0';
  const page = /^\d{1,3}$/.test(rawPage) ? Number(rawPage) : 0;
  return { view: rawView && views.includes(rawView) ? rawView : 'upcoming' as BookingView, page };
}
export function bookingReturnPath(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2000 || (value.includes('\\') || Array.from(value).some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127))) return '/my-bookings';
  return /^\/(my-bookings|provider\/organization\/[a-z0-9]+(?:-[a-z0-9]+)*)(?:\?[^#]*)?$/.test(value) ? value : '/my-bookings';
}
