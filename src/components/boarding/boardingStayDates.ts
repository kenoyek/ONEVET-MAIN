const boardingDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Africa/Lagos' });
export const todayInLagos = () => boardingDate.format(new Date());

export type StayDates = { arrival: string; departure: string };
const stayDatesKey = 'onevet.boarding-stay-dates';

export function readStayDates(): StayDates | null {
  try {
    const dates = JSON.parse(sessionStorage.getItem(stayDatesKey) ?? 'null');
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    if (typeof dates?.arrival !== 'string' || typeof dates.departure !== 'string'
      || !isoDate.test(dates.arrival) || !isoDate.test(dates.departure)
      || dates.arrival < todayInLagos() || dates.departure <= dates.arrival) {
      return null;
    }
    return { arrival: dates.arrival, departure: dates.departure };
  } catch {
    return null;
  }
}

export function writeStayDates(dates: StayDates | null) {
  if (dates) sessionStorage.setItem(stayDatesKey, JSON.stringify(dates));
  else sessionStorage.removeItem(stayDatesKey);
}
