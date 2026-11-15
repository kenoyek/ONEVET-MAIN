import {expect,it} from 'vitest';
import {serviceFee,serviceDelivery} from '@/lib/service-display';
it('does not turn missing service metadata into a free clinic appointment',()=>{
 expect(serviceFee(null,'NGN')).toBe('Confirm with provider');expect(serviceFee(Infinity,'NGN')).toBe('Confirm with provider');expect(serviceFee(5000,null)).toBe('Confirm with provider');
 expect(serviceDelivery(null)).toBe('Confirm delivery with provider');expect(serviceFee(0,'NGN')).toBe('NGN 0.00');expect(serviceFee(5000,'NGN')).toBe('NGN 5,000.00');
});
