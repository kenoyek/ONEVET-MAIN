import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {afterEach,expect,it,vi} from 'vitest';
const auth=vi.hoisted(()=>({id:'owner-a'}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:auth.id}})}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
vi.mock('@/hooks/usePets',()=>({usePets:()=>({pets:auth.id==='owner-a'?[{id:'pet',name:'Bello',breed:'Golden retriever',species:'dog',avatar_url:null,is_livestock:false,livestock_count:1}]:[],isLoading:false,isError:false,refetch:vi.fn()})}));
import {discoverPets} from '@/lib/pet-discovery';
import {PetCard} from '@/components/pets/PetCard';
import Pets from '@/pages/pets/Pets';
afterEach(()=>{cleanup();auth.id='owner-a';});
it('separates fish from other animals and respects the livestock flag',()=>{
 const fish=[{name:'Pond 1',breed:null,species:'fish',is_livestock:true},{name:'Fin',breed:null,species:'fish',is_livestock:false},{name:'Other animal',breed:null,species:'other',is_livestock:false}];
 expect(discoverPets(fish,'','fish','recent')).toHaveLength(2);expect(discoverPets(fish,'','other','recent').map(p=>p.name)).toEqual(['Other animal']);expect(discoverPets(fish,'','livestock','recent').map(p=>p.name)).toEqual(['Pond 1']);
});
it('normalizes search words and sorts without mutating stored order',()=>{
 const pets=[{name:'Bello',breed:'Golden retriever',species:'dog',is_livestock:false},{name:'Ada',breed:null,species:'cat',is_livestock:false}];
 expect(discoverPets(pets,' BELLO golden ','all','recent').map(p=>p.name)).toEqual(['Bello']);expect(discoverPets(pets,'','all','name').map(p=>p.name)).toEqual(['Ada','Bello']);expect(pets[0]?.name).toBe('Bello');
});
it('resets empty searches and removes private search drafts when accounts change',()=>{
 const view=render(<MemoryRouter><Pets/></MemoryRouter>);fireEvent.change(screen.getByLabelText('Search pets by name or breed'),{target:{value:'missing'}});expect(screen.getByText('No profiles match these filters')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Clear profile filters'}));expect(screen.getByRole('link',{name:/Bello/})).toHaveAttribute('href','/pets/pet');
 fireEvent.change(screen.getByLabelText('Search pets by name or breed'),{target:{value:'Private draft'}});auth.id='owner-b';view.rerender(<MemoryRouter><Pets/></MemoryRouter>);expect(screen.getByLabelText('Search pets by name or breed')).toHaveValue('');
});
it('recovers a broken photo with a fallback and tries a newly supplied photo',()=>{
 const pet={id:'pet',name:'Bello',species:'dog',breed:null,avatar_url:'/broken.webp',is_livestock:false,livestock_count:1};const view=render(<MemoryRouter><PetCard pet={pet}/></MemoryRouter>);
 fireEvent.error(screen.getByRole('img'));expect(screen.queryByRole('img')).not.toBeInTheDocument();
 view.rerender(<MemoryRouter><PetCard pet={{...pet,avatar_url:'/new.webp'}}/></MemoryRouter>);expect(screen.getByRole('img')).toHaveAttribute('src','/new.webp');
});
