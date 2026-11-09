import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { details, replacements }=vi.hoisted(()=>({details:vi.fn(),replacements:vi.fn()}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=> <nav>Navigation</nav>}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'customer-id'}})}));
vi.mock('@/lib/services/appointment-service',async original=>({...await original<typeof import('@/lib/services/appointment-service')>(),appointmentService:{details,replacements}}));
vi.mock('@/components/provider/BookingRequestList',()=>({BookingRequestCard:({booking,readOnly}:{booking:{id:string};readOnly:boolean})=><p>{booking.id} · {readOnly?'read only':'participant'}</p>}));
import AppointmentDetails from '@/pages/booking/AppointmentDetails';
function mount(){const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={cache}><MemoryRouter initialEntries={['/appointments/booking-id']}><Routes><Route path="/appointments/:id" element={<AppointmentDetails/>}/></Routes></MemoryRouter></QueryClientProvider>);}
describe('Private appointment details',()=>{
 beforeEach(()=>{vi.clearAllMocks();replacements.mockResolvedValue([]);});
 it('renders an unavailable state for an unauthorized or missing appointment',async()=>{
  details.mockRejectedValue(new Error('Not found'));mount();expect(await screen.findByRole('alert')).toHaveTextContent('participating account');expect(replacements).not.toHaveBeenCalled();
 });
 it('links replacement requests while retaining participant-only controls',async()=>{
  details.mockResolvedValue({id:'booking-id',customer_id:'customer-id',provider_owner_id:'provider-id'});replacements.mockResolvedValue([{id:'alternative-id',status:'pending',start_at:new Date(Date.now()+86400000).toISOString()}]);mount();expect(await screen.findByText('booking-id · participant')).toBeInTheDocument();expect(screen.getByRole('link',{name:/WAT/})).toHaveAttribute('href','/appointments/alternative-id');
 });
 it('enables delegated provider mode through scoped capabilities rather than calendar ownership',async()=>{
  details.mockResolvedValue({id:'booking-id',customer_id:'another-customer',provider_owner_id:'calendar-owner',provider_access:true,service_snapshot:{provider_slug:'our-clinic'}});mount();expect(await screen.findByText('booking-id · participant')).toBeInTheDocument();expect(screen.getByRole('link',{name:'Organization workspace'})).toHaveAttribute('href','/provider/organization/our-clinic');
 });
 it('keeps administrator observations read-only when the administrator is not a participant',async()=>{
  details.mockResolvedValue({id:'booking-id',customer_id:'another-customer',provider_owner_id:'another-provider'});mount();expect(await screen.findByText('booking-id · read only')).toBeInTheDocument();
 });
});
