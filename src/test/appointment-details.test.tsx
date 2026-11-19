import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { details, replacements }=vi.hoisted(()=>({details:vi.fn(),replacements:vi.fn()}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=> <nav>Navigation</nav>}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'customer-id'}})}));
vi.mock('@/lib/services/appointment-service',async original=>({...await original<typeof import('@/lib/services/appointment-service')>(),appointmentService:{details,replacements}}));
vi.mock('@/components/provider/BookingRequestList',()=>({BookingRequestCard:({booking,readOnly}:{booking:{id:string};readOnly:boolean})=><p>{booking.id} · {readOnly?'read only':'participant'}</p>}));
vi.mock('@/components/provider/AppointmentConversation',()=>({AppointmentConversation:()=> <p>Appointment conversation</p>}));
import AppointmentDetails from '@/pages/booking/AppointmentDetails';
function mount(hash=''){const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={cache}><MemoryRouter initialEntries={['/appointments/booking-id'+hash]}><Routes><Route path="/appointments/:id" element={<AppointmentDetails/>}/></Routes></MemoryRouter></QueryClientProvider>);return cache;}
describe('Private appointment details',()=>{
 beforeEach(()=>{vi.clearAllMocks();replacements.mockResolvedValue([]);});
 it('renders an unavailable state for an unauthorized or missing appointment',async()=>{
  details.mockRejectedValue(new Error('Not found'));mount();expect(await screen.findByRole('alert')).toHaveTextContent('participating account');expect(replacements).not.toHaveBeenCalled();
 });
 it('links replacement requests while retaining participant-only controls',async()=>{
  details.mockResolvedValue({id:'booking-id',customer_id:'customer-id',provider_owner_id:'provider-id'});replacements.mockResolvedValue([{id:'alternative-id',status:'pending',start_at:new Date(Date.now()+86400000).toISOString()}]);mount();expect(await screen.findByText('booking-id · participant')).toBeInTheDocument();expect(await screen.findByRole('link',{name:/WAT/})).toHaveAttribute('href','/appointments/alternative-id');
 });
 it('enables delegated provider mode through scoped capabilities rather than calendar ownership',async()=>{
  details.mockResolvedValue({id:'booking-id',customer_id:'another-customer',provider_owner_id:'calendar-owner',provider_access:true,service_snapshot:{provider_slug:'our-clinic'}});mount();expect(await screen.findByText('booking-id · participant')).toBeInTheDocument();expect(screen.getByRole('link',{name:'Organization workspace'})).toHaveAttribute('href','/provider/organization/our-clinic');
 });
 it('keeps administrator observations read-only when the administrator is not a participant',async()=>{
  details.mockResolvedValue({id:'booking-id',customer_id:'another-customer',provider_owner_id:'another-provider'});mount();expect(await screen.findByText('booking-id · read only')).toBeInTheDocument();
 });
 it('keeps the booking and conversation available when alternative requests fail',async()=>{
  details.mockResolvedValue({id:'booking-id',version:1,customer_id:'customer-id'});replacements.mockRejectedValueOnce(new Error('Offline'));mount();
  expect(await screen.findByText('booking-id · participant')).toBeInTheDocument();expect(await screen.findByRole('alert')).toHaveTextContent('Could not load alternative requests');expect(screen.getByText('Appointment conversation')).toBeInTheDocument();
 });
 it('does not wait for secondary history before rendering the booking and conversation',async()=>{
  let finish!:(rows:unknown[])=>void;details.mockResolvedValue({id:'booking-id',version:1,customer_id:'customer-id'});replacements.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));mount();
  await screen.findByText('booking-id · participant');expect(screen.getByText('Loading alternative requests…')).toBeInTheDocument();expect(screen.getByText('Appointment conversation')).toBeInTheDocument();
  await act(async()=>finish([]));await screen.findByText('No alternative requests to display.');
 });
 it('retries the secondary lookup without reloading the main record',async()=>{
  details.mockResolvedValue({id:'booking-id',version:1,customer_id:'customer-id'});replacements.mockRejectedValueOnce(new Error('Offline')).mockResolvedValue([{id:'alternative-id',status:'pending',start_at:new Date(Date.now()+86400000).toISOString()}]);mount();
  await screen.findByRole('button',{name:'Retry alternative requests'});fireEvent.click(screen.getByRole('button',{name:'Retry alternative requests'}));
  expect(await screen.findByRole('link',{name:/WAT/})).toHaveAttribute('href','/appointments/alternative-id');expect(details).toHaveBeenCalledOnce();expect(replacements).toHaveBeenCalledTimes(2);
 });
 it('hides cached appointment and conversation content after the main access check fails',async()=>{
  details.mockResolvedValue({id:'booking-id',version:1,customer_id:'customer-id'});const cache=mount();await screen.findByText('booking-id · participant');await screen.findByText('No alternative requests to display.');
  details.mockRejectedValueOnce({code:'42501'});await act(async()=>{await cache.invalidateQueries({queryKey:['appointment-detail']});});
  expect(await screen.findByRole('alert')).toHaveTextContent('Appointment unavailable');expect(screen.queryByText('booking-id · participant')).not.toBeInTheDocument();expect(screen.queryByText('Appointment conversation')).not.toBeInTheDocument();expect(screen.queryByRole('region',{name:'Alternative appointment requests'})).not.toBeInTheDocument();
 });
 it('hides cached alternatives after a failed secondary access check while retaining the main record',async()=>{
  details.mockResolvedValue({id:'booking-id',version:1,customer_id:'customer-id'});replacements.mockResolvedValue([{id:'alternative-id',status:'pending',start_at:new Date(Date.now()+86400000).toISOString()}]);const cache=mount();await screen.findByRole('link',{name:/WAT/});
  replacements.mockRejectedValueOnce({code:'42501'});await act(async()=>{await cache.invalidateQueries({queryKey:['appointment-replacements']});});await screen.findByRole('button',{name:'Retry alternative requests'});
  expect(screen.queryByRole('link',{name:/WAT/})).not.toBeInTheDocument();expect(screen.getByText('booking-id · participant')).toBeInTheDocument();expect(screen.getByText('Appointment conversation')).toBeInTheDocument();
 });

 it.each(['#appointment-messages','#messages'])('focuses the conversation after loading a message link (%s)',async hash=>{
  details.mockResolvedValue({id:'booking-id',version:1,customer_id:'customer-id'});mount(hash);await screen.findByText('booking-id · participant');
  expect(document.getElementById('appointment-messages')).toHaveFocus();expect(screen.getByText('Appointment conversation')).toBeInTheDocument();
 });

});
