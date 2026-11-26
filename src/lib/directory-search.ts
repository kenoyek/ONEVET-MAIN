import {bookingAnimalContext} from './booking-animal-context';
import {careSearchFilters,normalizeCareState} from './care-search';
const modes=['all','clinic_visit','video','home_visit'];
export function directoryFilters(params:URLSearchParams){
 const delivery=params.get('delivery')??'all';
 return {...careSearchFilters(params),state:normalizeCareState(params.get('state')??''),delivery:modes.includes(delivery)?delivery:'all',urgent:params.get('urgent')==='1'};
}
export function directorySearchParams(input:ReturnType<typeof directoryFilters>,veterinaryOnly=false,animalContext=''){
 const filters=directoryFilters(new URLSearchParams({category:input.category,city:input.city,state:input.state,q:input.query,delivery:input.delivery,urgent:input.urgent?'1':''}));
 const params=new URLSearchParams();
 if(!veterinaryOnly&&filters.category!=='all')params.set('category',filters.category);
 if(filters.city)params.set('city',filters.city);
 if(filters.state)params.set('state',filters.state);
 if(filters.query)params.set('q',filters.query);
 if(filters.delivery!=='all')params.set('delivery',filters.delivery);
 if(filters.urgent)params.set('urgent','1');
 const animal=bookingAnimalContext(animalContext);
 if(animal)params.set('animal',animal);
 return params;
}
