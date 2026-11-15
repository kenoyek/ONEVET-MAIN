export const farmTypeOptions=[['poultry','Poultry'],['cattle','Cattle'],['goats_sheep','Goats & sheep'],['pigs','Pigs'],['aquaculture','Aquaculture'],['mixed','Mixed farm'],['other','Other']] as const;
type FarmSearchRow={farm_name:string;farm_type:string;city:string;state:string};
export function discoverFarms<T extends FarmSearchRow>(farms:readonly T[],search:string,type:string,sort:string){
 const words=search.trim().slice(0,120).toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const selected=farmTypeOptions.some(([value])=>value===type)?type:'all';
 const result=farms.filter(farm=>(selected==='all'||farm.farm_type===selected)&&words.every(word=>`${farm.farm_name} ${farm.city} ${farm.state} ${farmTypeOptions.find(([value])=>value===farm.farm_type)?.[1]??farm.farm_type}`.toLocaleLowerCase().includes(word)));
 if(sort==='name')result.sort((a,b)=>a.farm_name.localeCompare(b.farm_name));
 return result;
}
