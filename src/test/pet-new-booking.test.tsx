import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PetValues } from '@/lib/validation';
const { insert, single, from, draft, success, account }=vi.hoisted(()=>({insert:vi.fn(),single:vi.fn(),from:vi.fn(),draft:{name:'Bello'},success:vi.fn(),account:{userId:'owner'}}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from}}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:account.userId},profile:{id:'profile',user_id:account.userId,is_active:true}})}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
vi.mock('@/components/pets/PetPhotoUpload',()=>({PetPhotoUpload:()=>null}));
vi.mock('@/components/pets/PetForm',()=>({PetForm:({onSubmit,isSubmitting}:{onSubmit:(values:PetValues)=>void;isSubmitting:boolean})=><button disabled={isSubmitting} onClick={()=>onSubmit({name:draft.name,species:'dog',isLivestock:false,livestockCount:1} as PetValues)}>Save pet</button>}));
vi.mock('sonner',()=>({toast:{success,error:vi.fn()}}));
import PetNew from '@/pages/pets/PetNew';
import { petBookingReturn } from '@/lib/pet-booking-return';
function Destination(){return <p>Booking return {useLocation().search}</p>;}
function mount(booking=true){return render(<MemoryRouter initialEntries={[booking ? '/pets/new?'+new URLSearchParams({returnTo:'/booking/new?service_id=service-one&start=time-one'}) : '/pets/new']}><Routes><Route path="/pets/new" element={<PetNew/>}/><Route path="/booking/new" element={<Destination/>}/></Routes></MemoryRouter>);}
beforeEach(()=>{account.userId='owner';draft.name='Bello';vi.clearAllMocks();single.mockReset();from.mockReturnValue({insert});insert.mockReturnValue({select:()=>({single})});});
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
  const eq=vi.fn();const maybeSingle=vi.fn().mockResolvedValue({data:{id:'recovered-pet'},error:null});const query={eq,maybeSingle,select:()=>({single:async()=>({data:{id:'recovered-pet'},error:null})})};eq.mockReturnValue(query);const update=vi.fn((_details:Record<string,unknown>)=>query);
  from.mockReturnValueOnce({insert}).mockReturnValue({select:()=>query,update});mount();fireEvent.click(screen.getByRole('button',{name:'Save pet'}));await screen.findByText(/Booking return/);
  expect(insert).toHaveBeenCalledTimes(1);expect(update).toHaveBeenCalledWith(expect.objectContaining({name:'Bello'}));expect(eq).toHaveBeenCalledWith('owner_id','profile');expect(screen.getByText(/Booking return/)).toHaveTextContent('animal=pet%3Arecovered-pet');
 });
 it('confirms standalone saves and offers the saved profile and useful next actions',async()=>{
  single.mockResolvedValue({data:{id:'f0000000-0000-4000-8000-000000000001'},error:null});mount(false);fireEvent.click(screen.getByRole('button',{name:'Save pet'}));
  expect(await screen.findByRole('heading',{name:'Bello is part of your care workspace.'})).toBeInTheDocument();
  expect(screen.getByRole('link',{name:/Open the saved profile/})).toHaveAttribute('href','/pets/f0000000-0000-4000-8000-000000000001');
  expect(screen.getByRole('link',{name:/Find care services/})).toHaveAttribute('href','/provider-marketplace?animal=pet%3Af0000000-0000-4000-8000-000000000001');
  expect(screen.getByRole('link',{name:/Browse the marketplace/})).toHaveAttribute('href','/marketplace');
  expect(screen.queryByRole('button',{name:'Save pet'})).not.toBeInTheDocument();
 });
 it('keeps a standalone failed save in the form without showing a success screen',async()=>{
  single.mockResolvedValue({data:null,error:new Error('offline')});mount(false);fireEvent.click(screen.getByRole('button',{name:'Save pet'}));
  await screen.findByRole('alert');expect(screen.queryByText('Profile created')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Save pet'})).toBeEnabled();
 });
 it('limits booking return links to the internal request route',()=>{
  expect(petBookingReturn('/booking/new?service_id=one')).toBe('/booking/new?service_id=one');for(const value of ['//example.invalid','/auth','/booking/new?date=one',null])expect(petBookingReturn(value)).toBeNull();
 });
 it('applies edited retry details to the same owned profile after an ambiguous create',async()=>{
  single.mockResolvedValueOnce({data:null,error:new Error('Lost response')}).mockResolvedValueOnce({data:null,error:{code:'23505'}});
  const eq=vi.fn();const query={eq,maybeSingle:async()=>({data:{id:'recovered-pet'},error:null}),select:()=>({single:async()=>({data:{id:'recovered-pet'},error:null})})};eq.mockReturnValue(query);const update=vi.fn((_details:Record<string,unknown>)=>query);
  from.mockReturnValue({insert,select:()=>query,update});mount();fireEvent.click(screen.getByRole('button',{name:'Save pet'}));await screen.findByRole('alert');
  draft.name='Bello corrected';fireEvent.click(screen.getByRole('button',{name:'Save pet'}));await screen.findByText(/Booking return/);
  expect(insert.mock.calls[0]![0].id).toBe(insert.mock.calls[1]![0].id);expect(update).toHaveBeenCalledWith(expect.objectContaining({name:'Bello corrected'}));
  expect(eq).toHaveBeenCalledWith('id',insert.mock.calls[0]![0].id);expect(eq).toHaveBeenCalledWith('owner_id','profile');expect(update.mock.calls[0]![0]).not.toHaveProperty('owner_id');
 });
 it('keeps the form open if the recovered profile update is not acknowledged',async()=>{
  single.mockResolvedValue({data:null,error:{code:'23505'}});
  const eq=vi.fn();const query={eq,maybeSingle:async()=>({data:{id:'recovered-pet'},error:null}),select:()=>({single:async()=>({data:null,error:null})})};eq.mockReturnValue(query);from.mockReturnValue({insert,select:()=>query,update:()=>query});
  mount(false);fireEvent.click(screen.getByRole('button',{name:'Save pet'}));await screen.findByRole('alert');expect(screen.queryByText('Profile created')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Save pet'})).toBeEnabled();
 });
 it('does not update a duplicate record that cannot be recovered for the current owner',async()=>{
  single.mockResolvedValue({data:null,error:{code:'23505'}});
  const eq=vi.fn();const query={eq,maybeSingle:async()=>({data:null,error:null})};eq.mockReturnValue(query);const update=vi.fn();from.mockReturnValue({insert,select:()=>query,update});
  mount();fireEvent.click(screen.getByRole('button',{name:'Save pet'}));await screen.findByRole('alert');expect(update).not.toHaveBeenCalled();expect(screen.queryByText(/Booking return/)).not.toBeInTheDocument();
 });

 it('does not expose a late save notification after the active account changes',async()=>{
  let finish!:(value:unknown)=>void;single.mockReturnValueOnce(new Promise(resolve=>{finish=resolve;}));
  const view=mount(false);fireEvent.click(screen.getByRole('button',{name:'Save pet'}));account.userId='second-owner';view.rerender(<MemoryRouter><PetNew/></MemoryRouter>);
  await act(async()=>finish({data:{id:'saved-old-account-pet'},error:null}));expect(success).not.toHaveBeenCalled();expect(screen.queryByText('Profile created')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Save pet'})).toBeEnabled();
 });

});
