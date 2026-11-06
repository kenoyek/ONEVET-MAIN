import { act,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { beforeEach,describe,expect,it,vi } from 'vitest';
const state=vi.hoisted(()=>({userId:'customer-id',details:vi.fn(),download:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:state.userId}})}));
vi.mock('@/lib/services/appointment-service',()=>({appointmentService:{details:state.details}}));
vi.mock('@/lib/appointment-calendar',async original=>({...await original<typeof import('@/lib/appointment-calendar')>(),downloadAppointmentCalendar:state.download}));
import {AppointmentCalendarDownload} from '@/components/provider/AppointmentCalendarDownload';
const id='f1111111-1111-4111-8111-111111111111';
const booking={id,customer_id:'customer-id',provider_owner_id:'provider-id',status:'confirmed',version:2,provider_eligibility:'eligible',start_at:new Date(Date.now()+86400000).toISOString(),end_at:new Date(Date.now()+86400000+45*60_000).toISOString(),updated_at:new Date().toISOString()};
describe('Calendar download control',()=>{
 beforeEach(()=>{vi.clearAllMocks();state.userId='customer-id';state.details.mockResolvedValue(booking);});
 it('rechecks the authenticated appointment before producing a calendar file',async()=>{
  render(<AppointmentCalendarDownload bookingId={id}/>);fireEvent.click(screen.getByRole('button',{name:'Download calendar copy'}));await waitFor(()=>expect(state.download).toHaveBeenCalledTimes(1));expect(state.details).toHaveBeenCalledWith(id);expect(state.download.mock.calls[0]?.[0]).toContain('STATUS:CONFIRMED');
 });
 it('blocks a stale card whose appointment has been cancelled',async()=>{
  state.details.mockResolvedValue({...booking,status:'cancelled'});render(<AppointmentCalendarDownload bookingId={id}/>);fireEvent.click(screen.getByRole('button',{name:'Download calendar copy'}));expect(await screen.findByRole('alert')).toHaveTextContent('still confirmed');expect(state.download).not.toHaveBeenCalled();
 });
 it('stops a pending export when its control is unmounted',async()=>{
  let release!:(value:unknown)=>void;state.details.mockReturnValue(new Promise(resolve=>{release=resolve;}));const view=render(<AppointmentCalendarDownload bookingId={id}/>);fireEvent.click(screen.getByRole('button',{name:'Download calendar copy'}));view.unmount();await act(async()=>release(booking));expect(state.download).not.toHaveBeenCalled();
 });
 it('stops an old response when the selected appointment changes',async()=>{
  let release!:(value:unknown)=>void;state.details.mockReturnValue(new Promise(resolve=>{release=resolve;}));const view=render(<AppointmentCalendarDownload bookingId={id}/>);fireEvent.click(screen.getByRole('button',{name:'Download calendar copy'}));view.rerender(<AppointmentCalendarDownload bookingId="f2222222-2222-4222-8222-222222222222"/>);await act(async()=>release(booking));expect(state.download).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Download calendar copy'})).toBeEnabled();
 });
 it('does not download an old account response after switching accounts',async()=>{
  let release!:(value:unknown)=>void;state.details.mockReturnValue(new Promise(resolve=>{release=resolve;}));const view=render(<AppointmentCalendarDownload bookingId={id}/>);fireEvent.click(screen.getByRole('button',{name:'Download calendar copy'}));state.userId='new-account';view.rerender(<AppointmentCalendarDownload bookingId={id}/>);await act(async()=>release(booking));expect(state.download).not.toHaveBeenCalled();
 });
});
