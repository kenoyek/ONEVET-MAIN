import { act,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { beforeEach,describe,expect,it,vi } from 'vitest';
const state=vi.hoisted(()=>({userId:'customer-id',details:vi.fn(),download:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:state.userId}})}));
vi.mock('@/lib/services/appointment-service',async original=>({...await original<typeof import('@/lib/services/appointment-service')>(),appointmentService:{details:state.details}}));
vi.mock('@/lib/appointment-calendar',async original=>({...await original<typeof import('@/lib/appointment-calendar')>(),downloadAppointmentCalendar:state.download}));
import {AppointmentCalendarDownload} from '@/components/provider/AppointmentCalendarDownload';
const id='f1111111-1111-4111-8111-111111111111';
const booking={id,customer_id:'customer-id',provider_owner_id:'provider-id',status:'confirmed',version:2,provider_eligibility:'eligible',start_at:new Date(Date.now()+86400000).toISOString(),end_at:new Date(Date.now()+86400000+45*60_000).toISOString(),updated_at:new Date().toISOString()};
describe('Calendar download control',()=>{
 beforeEach(()=>{vi.clearAllMocks();state.userId='customer-id';state.details.mockReset();state.details.mockResolvedValue(booking);});
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
 it('prepares once for immediate repeated clicks',async()=>{
  let release!:(value:unknown)=>void;state.details.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));render(<AppointmentCalendarDownload bookingId={id}/>);
  const button=screen.getByRole('button',{name:'Download calendar copy'});act(()=>{fireEvent.click(button);fireEvent.click(button);});expect(state.details).toHaveBeenCalledOnce();
  await act(async()=>release(booking));expect(state.download).toHaveBeenCalledOnce();expect(screen.getByRole('status')).toHaveTextContent('Calendar copy prepared for');
 });
 it('shows a receipt using the freshly checked appointment time',async()=>{
  const fresh={...booking,start_at:new Date(Date.now()+172800000).toISOString(),end_at:new Date(Date.now()+176400000).toISOString(),version:3};state.details.mockResolvedValue(fresh);
  render(<AppointmentCalendarDownload bookingId={id}/>);fireEvent.click(screen.getByRole('button',{name:'Download calendar copy'}));
  expect(await screen.findByRole('status')).toHaveTextContent('WAT');expect(screen.getByRole('status')).toHaveTextContent('Import the file into your calendar app.');
  expect(state.download.mock.calls[0]?.[0]).toContain('SEQUENCE:3');expect(state.download).toHaveBeenCalledOnce();
 });
 it('retries a failed preparation through a fresh authorized check',async()=>{
  state.details.mockRejectedValueOnce(new Error('Offline'));render(<AppointmentCalendarDownload bookingId={id}/>);fireEvent.click(screen.getByRole('button',{name:'Download calendar copy'}));
  await screen.findByRole('alert');expect(state.download).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Retry calendar download'}));
  await screen.findByRole('status');expect(state.details).toHaveBeenCalledTimes(2);expect(state.download).toHaveBeenCalledOnce();expect(screen.queryByRole('alert')).not.toBeInTheDocument();
 });
 it('does not unlock a new booking preparation when an older request finishes',async()=>{
  const releases:Array<(value:unknown)=>void>=[];state.details.mockImplementation(()=>new Promise(resolve=>releases.push(resolve)));
  const view=render(<AppointmentCalendarDownload bookingId={id}/>);fireEvent.click(screen.getByRole('button',{name:'Download calendar copy'}));
  const second='f2222222-2222-4222-8222-222222222222';view.rerender(<AppointmentCalendarDownload bookingId={second}/>);fireEvent.click(screen.getByRole('button',{name:'Download calendar copy'}));
  await act(async()=>releases[0]!(booking));expect(screen.getByRole('button',{name:'Preparing calendar…'})).toBeDisabled();expect(state.download).not.toHaveBeenCalled();
  await act(async()=>releases[1]!({...booking,id:second}));expect(state.download).toHaveBeenCalledOnce();
 });
 it('hides the previous receipt when the active account changes',async()=>{
  const view=render(<AppointmentCalendarDownload bookingId={id}/>);fireEvent.click(screen.getByRole('button',{name:'Download calendar copy'}));await screen.findByRole('status');
  state.userId='new-account';view.rerender(<AppointmentCalendarDownload bookingId={id}/>);expect(screen.queryByRole('status')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Download calendar copy'})).toBeEnabled();
 });

});
