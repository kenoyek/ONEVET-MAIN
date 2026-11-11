import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PetValues } from '@/lib/validation';
const { insert, single, from }=vi.hoisted(()=>({insert:vi.fn(),single:vi.fn(),from:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from}}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'owner'},profile:{id:'profile',user_id:'owner',is_active:true}})}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
vi.mock('@/components/pets/PetPhotoUpload',()=>({PetPhotoUpload:()=>null}));
vi.mock('@/components/pets/PetForm',()=>({PetForm:({onSubmit,isSubmitting}:{onSubmit:(values:PetValues)=>void;isSubmitting:boolean})=><button disabled={isSubmitting} onClick={()=>onSubmit({name:'Bello',species:'dog',isLivestock:false,livestockCount:1} as PetValues)}>Save pet</button>}));
import PetNew from '@/pages/pets/PetNew';
import { petBookingReturn } from '@/lib/pet-booking-return';
function Destination(){return <p>Booking return {useLocation().search}</p>;}
function mount(){render(<MemoryRouter initialEntries={['/pets/new?'+new URLSearchParams({returnTo:'/booking/new?service_id=service-one&start=time-one'})]}><Routes><Route path="/pets/new" element={<PetNew/>}/><Route path="/booking/new" element={<Destination/>}/></Routes></MemoryRouter>);}
beforeEach(()=>{vi.clearAllMocks();single.mockReset();from.mockReturnValue({insert});insert.mockReturnValue({select:()=>({single})});});
afterEach(cleanup);
describe('pet onboarding booking handoff',()=>{
 it('creates once during repeated clicks and returns with the new animal selected',async()=>{
  let finish!:(value:unknown)=>void;single.mockReturnValue(new Promise(resolve=>{finish=resolve;}));mount();const save=screen.getByRole('button',{name:'Save pet'});fireEvent.click(save);fireEvent.click(save);expect(insert).toHaveBeenCalledTimes(1);const id=insert.mock.calls[0]![0].id;finish({data:{id},error:null});
  expect(await screen.findByText(/Booking return/)).toHaveTextContent('animal=pet%3A'+id);expect(screen.getByText(/Booking return/)).toHaveTextContent('service_id=service-one');
 });
 it('reuses the same creation ID when an unsuccessful request is retried',async()=>{
  single.mockResolvedValueOnce({data:null,error:new Error('offline')}).mockResolvedValueOnce({data:{id:'saved-pet'},error:null});mount();fireEvent.click(screen.getByRole('button',{name:'Save pet'}));await screen.findByRole('alert');fireEvent.click(screen.getByRole('button',{name:'Save pet'}));await screen.findByText(/Booking return/);
  expect(insert.mock.calls[0]![0].id).toBe(insert.mock.calls[1]![0].id);
 });
 it('recovers an already created owned record after a lost response without creating another pet',async()=>{
  single.mockResolvedValue({data:null,error:{code:'23505'}});
  const eq=vi.fn();const maybeSingle=vi.fn().mockResolvedValue({data:{id:'recovered-pet'},error:null});const query={eq,maybeSingle};eq.mockReturnValue(query);
  from.mockReturnValueOnce({insert}).mockReturnValue({select:()=>query});mount();fireEvent.click(screen.getByRole('button',{name:'Save pet'}));await screen.findByText(/Booking return/);
  expect(insert).toHaveBeenCalledTimes(1);expect(eq).toHaveBeenCalledWith('owner_id','profile');expect(screen.getByText(/Booking return/)).toHaveTextContent('animal=pet%3Arecovered-pet');
 });
 it('limits booking return links to the internal request route',()=>{
  expect(petBookingReturn('/booking/new?service_id=one')).toBe('/booking/new?service_id=one');for(const value of ['//example.invalid','/auth','/booking/new?date=one',null])expect(petBookingReturn(value)).toBeNull();
 });
});
