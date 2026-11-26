export const careSearchCategories = [
  ['all','All care services'], ['veterinary','Veterinary care'],
  ['grooming','Grooming & wellbeing'], ['diagnostics','Diagnostics & labs'],
  ['training','Training & behaviour'],
] as const;
export function careSearchFilters(params:URLSearchParams) {
  const category=params.get('category')??'all';
  return {category:careSearchCategories.some(([value])=>value===category)?category:'all',
    city:(params.get('city')??'').trim().slice(0,80),query:(params.get('q')??'').trim().slice(0,120)};
}
export function careSearchLink(category:string,city:string,state='') {
  const filters=careSearchFilters(new URLSearchParams({category,city}));
  const params=new URLSearchParams();
  if(category!=='boarding' && filters.category!=='all')params.set('category',filters.category);
  if(filters.city)params.set('city',filters.city);
  const path = category === 'boarding' ? '/boarding' : '/provider-marketplace';
  const stateFilter = state.trim().slice(0, 80);
  if (category === 'boarding' && stateFilter) params.set('state', stateFilter);
  return path + (params.size ? '?' + params.toString() : '');
}
