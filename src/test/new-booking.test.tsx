import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { loadService, animals, slots, request }=vi.hoisted(()=>({loadService:vi.fn(),animals:vi.fn(),slots:vi.fn(),request:vi.fn()}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=> <nav>Navigation</nav>}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'customer-id'},profile:{id:'profile-id',user_id:'customer-id'}})}));
vi.mock('@/lib/services/appointment-service',async original=>({...await original<typeof import('@/lib/services/appointment-service')>(),appointmentService:{service:loadService,animals,slots,request}}));
import NewBooking from '@/pages/booking/NewBooking';
const start=new Date(Date.now()+86400000).toISOString();
function mount(){const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={cache}><MemoryRouter initialEntries={['/booking/new?service_id=service-id']}><Routes><Route path="/booking/new" element={<NewBooking/>}/><Route path="/my-bookings" element={<h1>Saved booking requests</h1>}/></Routes></MemoryRouter></QueryClientProvider>);}
async function fill(){fireEvent.change(await screen.findByLabelText('Animal or farm group'),{target:{value:'pet:pet-id'}});fireEvent.change(await screen.findByLabelText('Available start time · WAT'),{target:{value:start}});fireEvent.change(screen.getByLabelText('Contact phone (shared privately with the provider)'),{target:{value:'08012345678'}});fireEvent.click(screen.getByRole('checkbox'));}
describe('Customer appointment requests',()=>{
 beforeEach(()=>{vi.clearAllMocks();loadService.mockResolvedValue({id:'service-id',service_version:2,name:'Grooming session',organization_name:'Clinic',category:'grooming',delivery_mode:'clinic_visit',duration_minutes:45,base_price:15000,currency:'NGN',booking_enabled:true});animals.mockResolvedValue([{id:'pet-id',kind:'pet',name:'Milo',species:'dog'}]);slots.mockResolvedValue([{start_at:start,end_at:new Date(Date.parse(start)+45*60000).toISOString()}]);});
 it('retries a lost-response request with the same key and preserved customer details',async()=>{
  request.mockRejectedValueOnce(new Error('Network failure')).mockResolvedValueOnce('booking-id');mount();await fill();fireEvent.click(screen.getByRole('button',{name:'Submit booking request'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('try again');expect(screen.getByLabelText('Contact phone (shared privately with the provider)')).toHaveValue('08012345678');
  fireEvent.click(screen.getByRole('button',{name:'Submit booking request'}));await screen.findByRole('heading',{name:'Saved booking requests'});
  expect(request).toHaveBeenCalledTimes(2);expect(request.mock.calls[0]?.[0].key).toBe(request.mock.calls[1]?.[0].key);
 });
 it('requires a private visit address for home visits',async()=>{
  loadService.mockResolvedValue({id:'service-id',service_version:2,name:'Home grooming',organization_name:'Clinic',category:'grooming',delivery_mode:'home_visit',duration_minutes:30,base_price:20000,currency:'NGN',booking_enabled:true});mount();await fill();
  expect(screen.getByLabelText('Visit address (shared privately with the provider)')).toBeRequired();
  expect(screen.getByText(/No online payment is collected/)).toBeInTheDocument();
 });
 it('refreshes changed service details and requires a new acknowledgement after a stale-version failure',async()=>{
  request.mockRejectedValue({code:'40001'});mount();await fill();fireEvent.click(screen.getByRole('button',{name:'Submit booking request'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Refresh');await waitFor(()=>expect(loadService).toHaveBeenCalledTimes(2));expect(screen.getByRole('checkbox')).not.toBeChecked();expect(screen.getByRole('button',{name:'Submit booking request'})).toBeDisabled();
 });
 it('does not expose a request form when bookings are paused',async()=>{
  loadService.mockResolvedValue({id:'service-id',service_version:2,name:'Grooming',base_price:15000,booking_enabled:false});mount();await screen.findByText('This provider is not accepting booking requests right now.');expect(screen.queryByRole('button',{name:'Submit booking request'})).not.toBeInTheDocument();expect(slots).not.toHaveBeenCalled();
 });
});
