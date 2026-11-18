import { expect, it } from 'vitest';
import { bookingPreparation } from '@/lib/booking-preparation';
const now=Date.parse('2026-11-18T10:00:00Z');
const appointment={status:'confirmed',start:'2026-11-19T10:00:00Z',end:'2026-11-19T10:30:00Z',delivery:'clinic_visit',eligibility:'eligible' as const};
it('gives different practical steps for confirmed home and clinic visits',()=>{
 expect(bookingPreparation(appointment,now)?.steps[0]).toContain('provider location');
 expect(bookingPreparation({...appointment,delivery:'home_visit'},now)?.steps[0]).toContain('visit address');
});
it('does not assume a physical appointment when delivery is missing or unknown',()=>{
 for(const delivery of ['', 'video', 'unknown']) expect(bookingPreparation({...appointment,delivery},now)?.steps[0]).toContain('Confirm how and where');
});
it('does not offer attendance preparation for pending or expired requests',()=>{
 expect(bookingPreparation({...appointment,status:'pending'},now)?.title).toBe('While you wait for confirmation');
 expect(bookingPreparation({...appointment,status:'pending',start:'2026-11-18T10:15:00Z',end:'2026-11-18T10:45:00Z'},now)?.title).toBe('Choose a new appointment time');
 expect(bookingPreparation({...appointment,end:'2026-11-17T10:30:00Z'},now)?.title).toBe('Follow up on this appointment');
});
it.each(['unavailable','unknown',undefined] as const)('prioritizes uncertain approval over visit preparation (%s)',eligibility=>{
 const result=bookingPreparation({...appointment,eligibility},now);expect(result?.title).toContain('Check provider approval');expect(result?.steps.join(' ')).toContain('contact support');
});
it.each(['cancelled','declined','completed'])('does not prepare a closed %s request',status=>{
 expect(bookingPreparation({...appointment,status},now)).toBeNull();
});
