import type { WeeklyWindow } from '@/lib/services/appointment-service';
const weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export function validateProviderSchedule(weekly: readonly WeeklyWindow[], closedText: string) {
  const errors: string[] = [];
  const seen = new Set<number>();
  for (const day of weekly) {
    if (!Number.isInteger(day.weekday) || day.weekday < 0 || day.weekday > 6 || seen.has(day.weekday)) {
      errors.push('Choose at most one opening window for each day.'); continue;
    }
    seen.add(day.weekday);
    if (!Number.isInteger(day.opens) || !Number.isInteger(day.closes) || day.opens < 0 || day.closes > 1440 || day.opens % 15 || day.closes % 15 || day.opens >= day.closes) {
      errors.push(`${weekdays[day.weekday]} must close after it opens, using 15-minute boundaries within the same day.`);
    }
  }
  const dates=[...new Set(closedText.split(/\s+/).filter(Boolean))];
  if (dates.length > 60) errors.push('Use no more than 60 unique closed dates.');
  for (const date of dates) {
    const parsed=new Date(`${date}T00:00:00Z`);
    if (date.startsWith('0000-') || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10)!==date) {
      errors.push(`Check closed date “${date.slice(0,40)}”. Use a real calendar date in YYYY-MM-DD format.`);
    }
  }
  return { dates, errors:[...new Set(errors)] };
}
