import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { list,respond,history,schedule,saveSchedule }=vi.hoisted(()=>({list:vi.fn(),respond:vi.fn(),history:vi.fn(),schedule:vi.fn(),saveSchedule:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'customer-id'}})}));
vi.mock('@/lib/services/appointment-service',async original=>({...await original<typeof import('@/lib/services/appointment-service')>(),appointmentService:{list,respond,history,schedule,saveSchedule}}));
import { BookingRequestList } from '@/components/provider/BookingRequestList';
import { ProviderBookingManager } from '@/components/provider/ProviderBookingManager';
const booking={id:'booking-id',version:1,status:'pending',start_at:'2026-12-20T08:00:00Z',end_at:'2026-12-20T08:45:00Z',base_fee:15000,currency:'NGN',contact_phone:'08012345678',visit_address:'',provider_address:null,customer_notes:'',response_note:'',service_snapshot:{name:'Grooming',organization_name:'Clinic',delivery_mode:'clinic_visit'},animal_snapshot:{name:'Milo',species:'dog'}};
function mount(element:React.ReactElement){const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={cache}>{element}</QueryClientProvider>);}
describe('Booking management',()=>{
 beforeEach(()=>{vi.clearAllMocks();list.mockResolvedValue({rows:[booking],hasNext:false});history.mockResolvedValue([]);schedule.mockResolvedValue(null);saveSchedule.mockResolvedValue(1);});
 it('keeps provider confirmation controls out of the customer view',async()=>{
  mount(<BookingRequestList/>);await screen.findByText('Grooming');expect(screen.queryByRole('button',{name:'Confirm request'})).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Cancel request'})).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Response / explanation (required for cancellation or decline)'),{target:{value:'Cannot attend this appointment.'}});expect(screen.getByRole('button',{name:'Cancel request'})).toBeEnabled();
 });
 it('preserves a provider response when a confirmation loses a slot race',async()=>{
  respond.mockRejectedValue({code:'23P01'});mount(<BookingRequestList providerId="org-id"/>);await screen.findByText('Grooming');fireEvent.change(screen.getByLabelText('Response / explanation (required for cancellation or decline)'),{target:{value:'Please arrive on time.'}});fireEvent.click(screen.getByRole('button',{name:'Confirm request'}));expect(await screen.findByRole('alert')).toHaveTextContent('no longer available');expect(screen.getByLabelText('Response / explanation (required for cancellation or decline)')).toHaveValue('Please arrive on time.');expect(respond).toHaveBeenCalledWith(booking,'confirmed','Please arrive on time.');
 });
 it('warns about unavailable approval without claiming an existing confirmation was cancelled',async()=>{
  list.mockResolvedValue({rows:[{...booking,status:'confirmed',provider_eligibility:'unavailable'}],hasNext:false});mount(<BookingRequestList/>);expect(await screen.findByRole('alert')).toHaveTextContent('has not been cancelled automatically');expect(screen.getByRole('button',{name:'Cancel request'})).toBeInTheDocument();
 });
 it('loads private booking history only when requested',async()=>{
  mount(<BookingRequestList/>);await screen.findByText('Grooming');expect(history).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Show history'}));await waitFor(()=>expect(history).toHaveBeenCalledWith('booking-id'));
 });
 it('starts schedules disabled and saves explicit WAT windows with their version',async()=>{
  list.mockResolvedValue({rows:[],hasNext:false});mount(<ProviderBookingManager providerId="org-id"/>);const enabled=await screen.findByLabelText('Accept booking requests for published services');expect(enabled).not.toBeChecked();fireEvent.click(enabled);fireEvent.click(screen.getByLabelText('Monday'));fireEvent.click(screen.getByRole('button',{name:'Save availability'}));await waitFor(()=>expect(saveSchedule).toHaveBeenCalledWith('org-id',true,[{weekday:1,opens:540,closes:1020}],[],0));
 });
});
