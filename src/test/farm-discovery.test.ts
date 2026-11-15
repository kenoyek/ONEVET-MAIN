import {expect,it} from 'vitest';
import {discoverFarms} from '@/lib/farm-discovery';
const farms=[{farm_name:'Zebra Poultry',farm_type:'poultry',city:'Ibadan',state:'Oyo'},{farm_name:'Aqua Farm',farm_type:'aquaculture',city:'Lagos',state:'Lagos'}];
it('matches normalized names, location and production type together',()=>{
 expect(discoverFarms(farms,' IBADAN poultry ','all','recent').map(f=>f.farm_name)).toEqual(['Zebra Poultry']);
 expect(discoverFarms(farms,'','aquaculture','recent').map(f=>f.farm_name)).toEqual(['Aqua Farm']);
 expect(discoverFarms(farms,'Lagos','poultry','recent')).toEqual([]);
});
it('preserves source order and bounds invalid production filters',()=>{
 expect(discoverFarms(farms,'','all','name').map(f=>f.farm_name)).toEqual(['Aqua Farm','Zebra Poultry']);
 expect(farms[0]?.farm_name).toBe('Zebra Poultry');expect(discoverFarms(farms,'','invalid','recent')).toHaveLength(2);
});
