import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PetValues } from '@/lib/validation';
const { passport, update, single, success, user, profile }=vi.hoisted(()=>({passport:vi.fn(),update:vi.fn(),single:vi.fn(),success:vi.fn(),user:{id:'owner'},profile:{id:'profile',user_id:'owner',is_active:true}}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user,profile})}));
vi.mock('@/lib/services/pet-passport-service',()=>({petPassportService:{getPetPassport:passport}}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
vi.mock('@/components/pets/PetPhotoUpload',()=>({PetPhotoUpload:()=>null}));
vi.mock('@/components/pets/PetHealthJournal',()=>({PetHealthJournal:()=>null}));
vi.mock('@/components/pets/PetCaregiversManager',()=>({PetCaregiversManager:()=>null}));
vi.mock('@/components/pets/PetForm',()=>({PetForm:({onSubmit,isSubmitting}:{onSubmit:(values:PetValues)=>void;isSubmitting:boolean})=><button disabled={isSubmitting} onClick={()=>onSubmit({name:'Bello updated',species:'dog',isLivestock:false,livestockCount:1} as PetValues)}>Save Changes</button>}));
vi.mock('sonner',()=>({toast:{success,error:vi.fn()}}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:()=>({update,select:()=>({eq:()=>({order:()=>({limit:async()=>({data:[],error:null})})})})})}}));
import PetDetail from '@/pages/pets/PetDetail';
function mount(){render(<MemoryRouter initialEntries={['/pets/pet-one']}><Routes><Route path="/pets/:id" element={<PetDetail/>}/></Routes></MemoryRouter>);}
beforeEach(()=>{vi.clearAllMocks();passport.mockResolvedValue({pet:{id:'pet-one',name:'Bello',species:'dog',owner_id:'profile'},advancedAvailable:false});update.mockReturnValue({eq:()=>({select:()=>({single})})});});
afterEach(cleanup);
describe('pet save acknowledgements',()=>{
 it('keeps editing and shows an error when a write returns no saved row',async()=>{
  single.mockResolvedValue({data:null,error:null});mount();fireEvent.click(await screen.findByRole('button',{name:'Edit Profile'}));fireEvent.click(screen.getByRole('button',{name:'Save Changes'}));expect(await screen.findByRole('alert')).toHaveTextContent('profile could not be saved');expect(screen.getByRole('button',{name:'Save Changes'})).toBeInTheDocument();expect(success).not.toHaveBeenCalled();
 });
 it('dispatches one pending update and reports success only after a row is returned',async()=>{
  let finish!:(result:unknown)=>void;single.mockReturnValue(new Promise(resolve=>{finish=resolve;}));mount();fireEvent.click(await screen.findByRole('button',{name:'Edit Profile'}));const save=screen.getByRole('button',{name:'Save Changes'});fireEvent.click(save);fireEvent.click(save);expect(update).toHaveBeenCalledTimes(1);expect(success).not.toHaveBeenCalled();finish({data:{id:'pet-one'},error:null});await waitFor(()=>expect(success).toHaveBeenCalledWith('Pet profile updated'));
 });
});
