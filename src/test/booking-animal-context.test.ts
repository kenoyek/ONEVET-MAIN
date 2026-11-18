import { expect, it } from 'vitest';
import { bookingAnimalContext, withBookingAnimal } from '@/lib/booking-animal-context';
import { directoryFilters, directorySearchParams } from '@/lib/directory-search';
const id='f0000000-0000-4000-8000-000000000001';
it.each(['pet','farm_group'])('carries a %s through filters, provider and booking links', kind=>{
 const animal=`${kind}:${id}`;
 const params=directorySearchParams(directoryFilters(new URLSearchParams('city=Ibadan&q=care')),true,animal);
 expect(params.get('animal')).toBe(animal);expect(params.get('city')).toBe('Ibadan');
 const provider=withBookingAnimal('/provider/public/clinic',params.get('animal'));
 const booking=withBookingAnimal('/booking/new?service_id=service&date=2026-11-19&start=slot',new URL(provider,'https://1vet.store').searchParams.get('animal'));
 const url=new URL(booking,'https://1vet.store');expect(url.searchParams.get('animal')).toBe(animal);expect(url.searchParams.get('service_id')).toBe('service');expect(url.searchParams.get('start')).toBe('slot');
});
it('drops malformed hints and unrelated URL data',()=>{
 for(const value of [null,'pet:foreign','farm:'+id,'https://evil.invalid','pet:'+id+'?token=secret'])expect(bookingAnimalContext(value)).toBe('');
 expect(directorySearchParams(directoryFilters(new URLSearchParams('token=secret')),false,'bad').toString()).toBe('');
 expect(withBookingAnimal('/find-a-vet',null)).toBe('/find-a-vet');
});
