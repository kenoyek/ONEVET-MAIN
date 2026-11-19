import { expect, it } from 'vitest';
import { validateProviderSchedule } from '@/lib/provider-schedule-validation';
it('accepts aligned same-day windows including closing at midnight and deduplicates dates',()=>{
 expect(validateProviderSchedule([{weekday:1,opens:0,closes:1440}], '2028-02-29\n2028-02-29')).toEqual({dates:['2028-02-29'],errors:[]});
});
it.each([{weekday:1,opens:600,closes:540},{weekday:1,opens:540,closes:540},{weekday:1,opens:541,closes:600},{weekday:1,opens:540,closes:1441},{weekday:7,opens:540,closes:600}])('rejects invalid opening windows (%o)',window=>{
 expect(validateProviderSchedule([window],'').errors.length).toBeGreaterThan(0);
});
it('rejects duplicate weekdays',()=>{expect(validateProviderSchedule([{weekday:1,opens:540,closes:600},{weekday:1,opens:660,closes:720}],'').errors).toContain('Choose at most one opening window for each day.');});
it.each(['2027-02-29','2026-02-30','19/11/2026','0000-01-01'])('rejects invalid calendar closures (%s)',date=>{expect(validateProviderSchedule([],date).errors.length).toBeGreaterThan(0);});
it('limits the number of unique closures to sixty',()=>{
 const dates=Array.from({length:61},(_,i)=>new Date(Date.UTC(2026,0,i+1)).toISOString().slice(0,10));expect(validateProviderSchedule([],dates.join('\n')).errors).toContain('Use no more than 60 unique closed dates.');
});
