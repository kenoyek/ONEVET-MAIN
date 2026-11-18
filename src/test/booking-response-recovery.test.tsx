import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({respond:vi.fn(),refresh:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'provider'}})}));
vi.mock('@/lib/services/appointment-service',async original=>({...await original<typeof import('@/lib/services/appointment-service')>(),appointmentService:{respond:mock.respond}}));
import { BookingRequestCard } from '@/components/provider/BookingRequestList';
import type { Appointment } from '@/lib/services/appointment-service';
const booking:Appointment={batch_id:null,pet_id:'pet',created_at:new Date().toISOString(),updated_at:new Date().toISOString(),customer_notes:'',provider_address:null,replacement_for:null,replacement_version:null,request_key:'request-key',reschedule_reason:'',response_note:'',service_id:'service',visit_address:'',id:'request',customer_id:'customer',provider_id:'org',provider_owner_id:'provider',provider_access:true,provider_eligibility:'eligible',version:1,status:'pending',start_at:new Date(Date.now()+86400000).toISOString(),end_at:new Date(Date.now()+90000000).toISOString(),base_fee:5000,currency:'NGN',contact_phone:'08012345678',service_snapshot:{name:'Vet visit',organization_name:'Clinic'},animal_snapshot:{name:'Bello',species:'dog'}};
function mount(){return render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><BookingRequestCard booking={booking} provider refresh={mock.refresh}/></MemoryRouter></QueryClientProvider>);}
beforeEach(()=>{vi.clearAllMocks();mock.respond.mockReset();mock.refresh.mockReset();mock.refresh.mockResolvedValue(undefined);});afterEach(cleanup);
it.each(['40001','23P01','42501'])('requires reviewing a changed request before another response (%s)',async code=>{
 mock.respond.mockRejectedValueOnce({code});mount();fireEvent.change(screen.getByLabelText(/Response \/ explanation/),{target:{value:'Please arrive on time.'}});
 fireEvent.click(screen.getByRole('button',{name:'Confirm request'}));await screen.findByRole('region',{name:'Review changed request'});
 expect(screen.getByRole('button',{name:'Confirm request'})).toBeDisabled();expect(screen.getByRole('button',{name:'Decline request'})).toBeDisabled();
 expect(screen.getByLabelText(/Response \/ explanation/)).toHaveValue('Please arrive on time.');
 fireEvent.click(screen.getByRole('button',{name:'Confirm request'}));expect(mock.respond).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button',{name:'Refresh request details'}));await waitFor(()=>expect(screen.getByRole('button',{name:'Confirm request'})).toBeEnabled());
 expect(mock.refresh).toHaveBeenCalledOnce();expect(screen.getByLabelText(/Response \/ explanation/)).toHaveValue('Please arrive on time.');
});
it('keeps decisions locked and the note intact when review refresh fails',async()=>{
 mock.respond.mockRejectedValueOnce({code:'40001'});mock.refresh.mockRejectedValueOnce(new Error('Offline'));mount();
 fireEvent.change(screen.getByLabelText(/Response \/ explanation/),{target:{value:'Client requested a change.'}});fireEvent.click(screen.getByRole('button',{name:'Confirm request'}));
 await screen.findByRole('region',{name:'Review changed request'});fireEvent.click(screen.getByRole('button',{name:'Refresh request details'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Could not refresh');expect(screen.getByRole('button',{name:'Cancel request'})).toBeDisabled();expect(screen.getByLabelText(/Response \/ explanation/)).toHaveValue('Client requested a change.');
});
it('keeps a confirmed saved response distinct from a failed refresh',async()=>{
 mock.respond.mockResolvedValueOnce(undefined);mock.refresh.mockRejectedValueOnce(new Error('Offline'));mount();fireEvent.click(screen.getByRole('button',{name:'Confirm request'}));
 await screen.findByText(/Your response was saved. Refresh request details/);expect(screen.queryByRole('alert')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Confirm request'})).toBeDisabled();expect(mock.respond).toHaveBeenCalledOnce();
});
it('allows an ordinary ambiguous write failure to retry with its explanation',async()=>{
 mock.respond.mockRejectedValueOnce(new Error('Offline'));mount();fireEvent.change(screen.getByLabelText(/Response \/ explanation/),{target:{value:'Please arrive on time.'}});fireEvent.click(screen.getByRole('button',{name:'Confirm request'}));await screen.findByRole('alert');
 expect(screen.queryByRole('region',{name:'Review changed request'})).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Confirm request'})).toBeEnabled();expect(screen.getByLabelText(/Response \/ explanation/)).toHaveValue('Please arrive on time.');
});
