export function bookingStatus(status: string, start: string, end: string, now = Date.now()) {
  if (status === 'pending') return Date.parse(start) < now + 30 * 60_000
    ? { label: 'Confirmation window passed', text: 'This request was not confirmed in time. It has not been cancelled automatically. Cancel or decline it with an explanation and choose a new time.' }
    : { label: 'Awaiting confirmation', text: 'The provider must confirm this request. The slot is not reserved, and confirmation needs at least 30 minutes’ notice.' };
  if (status === 'confirmed') return Date.parse(end) < now
    ? { label: 'Past appointment · still open', text: 'The appointment time has passed, but this record has not been marked completed. Use appointment messages to follow up with the other participant.' }
    : { label: 'Confirmed', text: 'Your appointment is confirmed. Review the recorded time, animal and location, and agree any additional costs before care.' };
  if (status === 'cancelled') return { label: 'Cancelled', text: 'This appointment is cancelled. Review the latest response or history for the explanation. A new appointment requires a new request.' };
  if (status === 'declined') return { label: 'Declined', text: 'The provider declined this request. Review their response and browse services to choose another time or provider.' };
  if (status === 'completed') return { label: 'Completed', text: 'The provider marked this appointment completed. You can review the recorded details and conversation.' };
  return { label: 'Status unavailable', text: 'Refresh this appointment or contact support to check its current status.' };
}
