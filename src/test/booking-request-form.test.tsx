import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { service, animals, slots, request }=vi.hoisted(()=>({service:vi.fn(),animals:vi.fn(),slots:vi.fn(),request:vi.fn()}));
const contact=vi.hoisted(()=>({phone:''}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'customer'},profile:{id:'profile',user_id:'customer',phone:contact.phone}})}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=> <nav>Navigation</nav>}));
vi.mock('@/lib/services/appointment-service',()=>({appointmentService:{service,animals,slots,request},watDate:()=> '2026-11-11',bookingTime:()=> '11 November · 11:00 WAT',appointmentError:(error:{code?:string})=>error.code==='23P01'?'That time is no longer available.':'The request could not be sent. Try again.'}));
import NewBooking from '@/pages/booking/NewBooking';
const start='2026-11-11T10:00:00Z';
function mount(){const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});return render(<QueryClientProvider client={cache}><MemoryRouter initialEntries={['/booking/new?service_id=service-one&date=2026-11-11&start='+encodeURIComponent(start)]}><Routes><Route path="/booking/new" element={<NewBooking/>}/><Route path="/appointments/:id" element={<p>Request received</p>}/></Routes></MemoryRouter></QueryClientProvider>);}
async function fill(expectReady=true){await screen.findByLabelText('Animal or farm group');fireEvent.change(screen.getByLabelText('Animal or farm group'),{target:{value:'pet:pet-one'}});fireEvent.change(screen.getByLabelText(/Contact phone/),{target:{value:'08012345678'}});fireEvent.click(screen.getByRole('checkbox'));if(expectReady)await waitFor(()=>expect(screen.getByRole('button',{name:'Submit booking request'})).toBeEnabled());}
beforeEach(()=>{contact.phone='';vi.clearAllMocks();service.mockResolvedValue({id:'service-one',service_version:3,name:'Wellness visit',organization_name:'Care clinic',city:'Lagos',state:'Lagos',base_price:5000,currency:'NGN',duration_minutes:30,booking_enabled:true,category:'veterinary',delivery_mode:'clinic_visit'});animals.mockResolvedValue([{id:'pet-one',kind:'pet',name:'Bello',species:'dog'}]);slots.mockResolvedValue([{start_at:start,end_at:'2026-11-11T10:30:00Z'}]);});
afterEach(cleanup);
describe('booking request safety and review',()=>{
 it('shows the review and sends one request for repeated pending submissions',async()=>{
  let finish!:(id:string)=>void;request.mockReturnValue(new Promise(resolve=>{finish=resolve;}));const {container}=mount();await fill();
  expect(screen.getByRole('heading',{name:'Review your request'})).toBeInTheDocument();expect(screen.getByText('Bello')).toBeInTheDocument();
  fireEvent.submit(container.querySelector('form')!);fireEvent.submit(container.querySelector('form')!);expect(request).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText(/Contact phone/)).toBeDisabled();finish('booking-one');await screen.findByText('Request received');
 });
 it('keeps input and an idempotency key after an ambiguous network failure',async()=>{
  request.mockRejectedValueOnce(new Error('offline')).mockResolvedValue('booking-one');const {container}=mount();await fill();fireEvent.submit(container.querySelector('form')!);await screen.findByRole('alert');
  expect(screen.getByLabelText(/Contact phone/)).toHaveValue('08012345678');await waitFor(()=>expect(screen.getByRole('button',{name:'Submit booking request'})).toBeEnabled());fireEvent.submit(container.querySelector('form')!);await screen.findByText('Request received');
  expect(request.mock.calls[0]![0].key).toBe(request.mock.calls[1]![0].key);
 });
 it('clears a conflicting time while retaining contact details',async()=>{
  request.mockRejectedValue({code:'23P01'});const {container}=mount();await fill();fireEvent.submit(container.querySelector('form')!);await screen.findByRole('alert');await waitFor(()=>expect(screen.getByLabelText('Available start time · WAT')).toHaveValue(''));
  expect(screen.getByLabelText(/Contact phone/)).toHaveValue('08012345678');expect(screen.getByRole('button',{name:'Submit booking request'})).toBeDisabled();
 });
 it('prefills a valid account phone and preserves the client’s edit on profile refresh',async()=>{
  contact.phone='08012345678';mount();await screen.findByLabelText(/Contact phone/);
  expect(screen.getByLabelText(/Contact phone/)).toHaveValue('08012345678');
  fireEvent.change(screen.getByLabelText(/Contact phone/),{target:{value:'07000000000'}});
  contact.phone='08099999999';fireEvent.change(screen.getByLabelText(/Notes for the provider/),{target:{value:'First visit'}});
  expect(screen.getByLabelText(/Contact phone/)).toHaveValue('07000000000');
 });
 it('explains missing steps and rejects a non-phone contact before submission',async()=>{
  const {container}=mount();await screen.findByLabelText('Animal or farm group');
  expect(screen.getByText('Choose your animal or farm group.')).toBeInTheDocument();
  expect(screen.getByText('Add a contact phone with 7–15 digits.')).toBeInTheDocument();
  await fill();fireEvent.change(screen.getByLabelText(/Contact phone/),{target:{value:'not-a-phone'}});
  expect(screen.getByRole('button',{name:'Submit booking request'})).toBeDisabled();
  fireEvent.submit(container.querySelector('form')!);expect(request).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText(/Contact phone/),{target:{value:'+234 705 239 8371'}});
  expect(screen.getByText('Ready to send. The provider will need to confirm your appointment.')).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Submit booking request'})).toBeEnabled();
 });
 it('requires a home visit address and explains the missing requirement',async()=>{
  service.mockResolvedValue({...await service(),delivery_mode:'home_visit'});mount();await fill(false);
  expect(screen.getByText('Add a visit address of at least 10 characters.')).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Submit booking request'})).toBeDisabled();
  fireEvent.change(screen.getByLabelText(/Visit address/),{target:{value:'12 Main Road, Ibadan'}});
  expect(screen.getByRole('button',{name:'Submit booking request'})).toBeEnabled();
 });
 it('blocks an expired shared time that is absent from current availability',async()=>{
  slots.mockResolvedValue([]);mount();await screen.findByText('Your selected time is no longer available. Choose another time.');expect(screen.getByRole('button',{name:'Submit booking request'})).toBeDisabled();expect(request).not.toHaveBeenCalled();
 });
});
