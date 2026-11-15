export const petSpeciesOptions=[['all','All species'],['dog','Dogs'],['cat','Cats'],['bird','Birds'],['rabbit','Rabbits'],['fish','Fish'],['cattle','Cattle'],['goat','Goats'],['sheep','Sheep'],['poultry','Poultry'],['pig','Pigs'],['horse','Horses'],['other','Other'],['livestock','Livestock profiles']] as const;
type DiscoverablePet={name:string;breed:string|null;species:string;is_livestock:boolean|null};
export function discoverPets<T extends DiscoverablePet>(pets:readonly T[],search:string,species:string,sort:string){
 const words=search.trim().slice(0,120).toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const category=petSpeciesOptions.some(([value])=>value===species)?species:'all';
 const result=pets.filter(pet=>(category==='all'||(category==='livestock'?pet.is_livestock===true:pet.species===category))&&words.every(word=>`${pet.name} ${pet.breed??''} ${pet.species}`.toLocaleLowerCase().includes(word)));
 if(sort==='name')result.sort((a,b)=>a.name.localeCompare(b.name));
 return result;
}
