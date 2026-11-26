import {expect,it} from 'vitest';
import {directoryFilters,directorySearchParams} from '@/lib/directory-search';
it('bounds shared filters and removes unrecognized URL fields',()=>{
 const filters=directoryFilters(new URLSearchParams('category=unknown&delivery=bad&urgent=true&token=private&city= Ibadan '));
 expect(filters).toEqual({category:'all',city:'Ibadan',state:'',query:'',delivery:'all',urgent:false});
 expect(directorySearchParams(filters).toString()).toBe('city=Ibadan');
});
it('round-trips a complete directory search and preserves the veterinarian route restriction',()=>{
 const filters={category:'grooming',city:'Ibadan',state:'Oyo',query:'coat care',delivery:'home_visit',urgent:true};
 expect(directoryFilters(directorySearchParams(filters))).toEqual(filters);
 expect(directorySearchParams(filters,true).has('category')).toBe(false);
});

it('normalizes shared FCT alias links to the picker value', () => {
 const filters = directoryFilters(new URLSearchParams('state=Abuja'));
 expect(filters.state).toBe('Federal Capital Territory');
 expect(directorySearchParams(filters, true).get('state')).toBe('Federal Capital Territory');
});
