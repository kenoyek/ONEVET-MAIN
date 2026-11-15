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

export function bookingViewHelp(view:BookingView){
 const descriptions:Record<BookingView,string>={
  upcoming:'Pending and confirmed requests whose end time has not passed. Pending requests still need provider confirmation.',
  needs_response:'Pending requests with at least 30 minutes before their start time. Check Upcoming or All requests for other open records.',
  past_open:'Pending or confirmed requests whose end time has passed. They have not been closed automatically; use the recorded status and conversation to follow up.',
  history:'Cancelled, declined and completed requests. Open a record to review its response and conversation.',
  all:'All recorded request statuses, including older requests that may still need follow-up.',
 };
 return descriptions[view];
}
