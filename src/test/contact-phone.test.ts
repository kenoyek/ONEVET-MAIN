import { expect, it } from 'vitest';
import { validContactPhone } from '@/lib/contact-phone';
it.each(['+2347052398371','07052398371','+234 705 239 8371','(0705) 239-8371','+1.415.555.2671','1234567','123456789012345'])('accepts a supported phone format (%s)',value=>{
 expect(validContactPhone(value)).toBe(true);
});
it.each([null,undefined,'','123456','1234567890123456','Call 07052398371','07052398371 ext 123','0705+2398371','++2347052398371','07052398371@example.com','0705\n2398371','1'+' '.repeat(40)+'234567'])('rejects invalid contact formats (%s)',value=>{
 expect(validContactPhone(value)).toBe(false);
});
