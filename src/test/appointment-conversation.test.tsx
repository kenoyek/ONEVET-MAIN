import {act,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({userId:'customer-a',state:vi.fn(),messages:vi.fn(),send:vi.fn(),markRead:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:mock.userId}})}));
vi.mock('@/lib/services/appointment-conversation-service',async original=>({...await original<typeof import('@/lib/services/appointment-conversation-service')>(),appointmentConversationService:{state:mock.state,messages:mock.messages,send:mock.send,markRead:mock.markRead}}));
import {AppointmentConversation} from '@/components/provider/AppointmentConversation';
const message={id:'message-id',ordinal:7,sender_id:'provider-id',sender_name:'Coordinator',sender_role:'provider_team',body:'Arrival details',created_at:new Date().toISOString()};
function mount(id='booking-a'){const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});const wrapper=({children}:{children:React.ReactNode})=><QueryClientProvider client={cache}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>;return {...render(<AppointmentConversation bookingId={id}/>,{wrapper}),cache};}
describe('Appointment conversation UI',()=>{
 beforeEach(()=>{vi.clearAllMocks();mock.userId='customer-a';mock.state.mockResolvedValue({can_send:true,unread_count:1,last_read_ordinal:0,last_ordinal:8});mock.messages.mockResolvedValue({rows:[message],hasOlder:false});mock.markRead.mockResolvedValue(undefined);});
 it('retains the draft and nonce after a lost response, then clears only after confirmation',async()=>{
  mock.send.mockRejectedValueOnce(new Error('Network')).mockResolvedValueOnce('new-message-id');mount();fireEvent.change(await screen.findByLabelText('Message to the appointment participants'),{target:{value:'Can I arrive ten minutes early?'}});fireEvent.click(screen.getByRole('button',{name:'Send message'}));expect(await screen.findByRole('alert')).toHaveTextContent('draft is retained');expect(screen.getByLabelText('Message to the appointment participants')).toHaveValue('Can I arrive ten minutes early?');fireEvent.click(screen.getByRole('button',{name:'Send message'}));await screen.findByText('Message saved to the conversation.');expect(mock.send.mock.calls[0]?.[2]).toBe(mock.send.mock.calls[1]?.[2]);expect(screen.getByLabelText('Message to the appointment participants')).toHaveValue('');
 });
 it('marks only visible messages, not a newer ordinal reported by state',async()=>{
  mount();await screen.findByText('Arrival details');fireEvent.click(screen.getByRole('button',{name:'Mark messages through this page as read'}));await waitFor(()=>expect(mock.markRead).toHaveBeenCalledWith('booking-a',7));
 });
 it('shows closed conversations without sending controls',async()=>{
  mock.state.mockResolvedValue({can_send:false,unread_count:0,last_read_ordinal:7,last_ordinal:7});mount();await screen.findByText('Arrival details');expect(screen.getByText(/This conversation is read-only/)).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Send message'})).not.toBeInTheDocument();
 });
 it('renders message content as text rather than executable markup',async()=>{
  mock.messages.mockResolvedValue({rows:[{...message,body:'<img src=x onerror=alert(1)>'}],hasOlder:false});mount();await screen.findByText('<img src=x onerror=alert(1)>');expect(document.querySelector('img[src="x"]')).toBeNull();
 });
 it('hides the conversation rather than displaying stale messages on access failure',async()=>{
  mock.state.mockRejectedValue({code:'42501'});mount();expect(await screen.findByRole('alert')).toHaveTextContent('access was removed');expect(screen.queryByText('Arrival details')).not.toBeInTheDocument();expect(mock.messages).not.toHaveBeenCalled();
 });
 it('resets drafts when the selected appointment changes',async()=>{
  const view=mount();fireEvent.change(await screen.findByLabelText('Message to the appointment participants'),{target:{value:'Private draft for A'}});view.rerender(<AppointmentConversation bookingId="booking-b"/>);expect(await screen.findByLabelText('Message to the appointment participants')).toHaveValue('');
 });
 it('does not display an old account response or draft after switching accounts',async()=>{
  let release!:(value:unknown)=>void;mock.messages.mockImplementation((id:string)=>id==='booking-a'&&mock.userId==='customer-a'?new Promise(resolve=>{release=resolve;}):Promise.resolve({rows:[],hasOlder:false}));const view=mount();await waitFor(()=>expect(mock.messages).toHaveBeenCalled());fireEvent.change(await screen.findByLabelText('Message to the appointment participants'),{target:{value:'Private account A draft'}});mock.userId='customer-b';view.rerender(<AppointmentConversation bookingId="booking-a"/>);await waitFor(()=>expect(screen.getByLabelText('Message to the appointment participants')).toHaveValue(''));await act(async()=>release({rows:[{...message,body:'PRIVATE OLD ACCOUNT'}],hasOlder:false}));expect(screen.queryByText('PRIVATE OLD ACCOUNT')).not.toBeInTheDocument();
 });
});

describe('Conversation recovery',()=>{
 beforeEach(()=>{vi.clearAllMocks();mock.send.mockReset();mock.markRead.mockResolvedValue(undefined);});
 it('keeps the client draft copyable when a later access check fails without exposing old messages',async()=>{
 mock.userId='customer-a';mock.state.mockResolvedValue({can_send:true,unread_count:1,last_read_ordinal:0,last_ordinal:8});mock.messages.mockResolvedValue({rows:[message],hasOlder:false});
 mount();fireEvent.change(await screen.findByLabelText('Message to the appointment participants'),{target:{value:'Unsaved arrival question'}});await screen.findByText('Arrival details');
 mock.state.mockRejectedValueOnce({code:'42501'});fireEvent.click(screen.getByRole('button',{name:'Refresh messages'}));
 await screen.findByText('Could not load this conversation, or your access was removed.');
 expect(screen.getByLabelText('Your retained draft')).toHaveValue('Unsaved arrival question');expect(screen.getByLabelText('Your retained draft')).toHaveAttribute('readonly');
 expect(screen.queryByText('Arrival details')).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Send message'})).not.toBeInTheDocument();
 mock.state.mockResolvedValue({can_send:true,unread_count:1,last_read_ordinal:0,last_ordinal:8});fireEvent.click(screen.getByRole('button',{name:'Retry conversation'}));
 expect(await screen.findByLabelText('Message to the appointment participants')).toHaveValue('Unsaved arrival question');
});
it('sends once for two immediate submit events and clears the draft only after confirmation',async()=>{
 mock.userId='customer-a';mock.state.mockResolvedValue({can_send:true,unread_count:0,last_read_ordinal:0,last_ordinal:0});mock.messages.mockResolvedValue({rows:[],hasOlder:false});
 let finish!:(id:string)=>void;mock.send.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
 const view=mount();fireEvent.change(await screen.findByLabelText('Message to the appointment participants'),{target:{value:'Arrival question'}});
 const form=view.container.querySelector('form')!;act(()=>{fireEvent.submit(form);fireEvent.submit(form);});
 expect(mock.send).toHaveBeenCalledTimes(1);expect(screen.getByLabelText('Message to the appointment participants')).toHaveValue('Arrival question');
 await act(async()=>finish('saved-message'));await screen.findByText('Message saved to the conversation.');expect(screen.getByLabelText('Message to the appointment participants')).toHaveValue('');
});
it('distinguishes a failed read receipt from a failed message send',async()=>{
 mock.userId='customer-a';mock.state.mockResolvedValue({can_send:true,unread_count:1,last_read_ordinal:0,last_ordinal:8});mock.messages.mockResolvedValue({rows:[message],hasOlder:false});mock.markRead.mockRejectedValueOnce(new Error('Offline'));
 mount();await screen.findByText('Arrival details');fireEvent.click(screen.getByRole('button',{name:'Mark messages through this page as read'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Could not confirm your read status');expect(screen.getByRole('alert')).toHaveTextContent('do not need to resend');
});

it('does not report a saved message as failed when refreshing its view fails',async()=>{
 mock.userId='customer-a';mock.state.mockResolvedValue({can_send:true,unread_count:0,last_read_ordinal:0,last_ordinal:0});mock.messages.mockResolvedValue({rows:[],hasOlder:false});mock.send.mockResolvedValueOnce('saved-message');
 const view=mount();fireEvent.change(await screen.findByLabelText('Message to the appointment participants'),{target:{value:'Arrival question'}});
 vi.spyOn(view.cache,'invalidateQueries').mockRejectedValueOnce(new Error('Refresh failed'));fireEvent.click(screen.getByRole('button',{name:'Send message'}));
 await screen.findByText('Message saved to the conversation. Refresh messages to load the latest view; do not send it again.');
 expect(screen.getByLabelText('Message to the appointment participants')).toHaveValue('');expect(screen.queryByRole('alert')).not.toBeInTheDocument();expect(mock.send).toHaveBeenCalledOnce();
});

it('reports a saved read receipt accurately when the unread-count refresh fails',async()=>{
 mock.userId='customer-a';mock.state.mockResolvedValue({can_send:true,unread_count:1,last_read_ordinal:0,last_ordinal:8});mock.messages.mockResolvedValue({rows:[message],hasOlder:false});
 const view=mount();await screen.findByText('Arrival details');vi.spyOn(view.cache,'invalidateQueries').mockRejectedValueOnce(new Error('Refresh failed'));
 fireEvent.click(screen.getByRole('button',{name:'Mark messages through this page as read'}));
 expect(await screen.findByRole('status')).toHaveTextContent('Read status saved. Refresh messages to update the unread count.');expect(screen.queryByRole('alert')).not.toBeInTheDocument();expect(mock.markRead).toHaveBeenCalledWith('booking-a',7);
});
it('acknowledges once during repeated clicks and reports the saved visible boundary',async()=>{
 mock.userId='customer-a';mock.state.mockResolvedValue({can_send:true,unread_count:1,last_read_ordinal:0,last_ordinal:8});mock.messages.mockResolvedValue({rows:[message],hasOlder:false});
 let finish!:()=>void;mock.markRead.mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=resolve;}));mount();await screen.findByText('Arrival details');const button=screen.getByRole('button',{name:'Mark messages through this page as read'});
 act(()=>{fireEvent.click(button);fireEvent.click(button);});expect(mock.markRead).toHaveBeenCalledTimes(1);expect(button).toBeDisabled();
 await act(async()=>finish());expect(await screen.findByRole('status')).toHaveTextContent('Read status saved through the messages on this page.');await waitFor(()=>expect(button).toBeEnabled());
});

it('retraces older pages and retains the draft before returning to the latest messages',async()=>{
 mock.userId='customer-a';mock.state.mockResolvedValue({can_send:true,unread_count:1,last_read_ordinal:0,last_ordinal:90});
 mock.messages.mockImplementation((_id:string,before?:number)=>Promise.resolve({rows:[{...message,ordinal:before===undefined?61:before===61?31:1,body:before===undefined?'Latest page':before===61?'Middle page':'Oldest page'}],hasOlder:before!==31}));
 mount();await screen.findByText('Latest page');fireEvent.change(screen.getByLabelText('Message to the appointment participants'),{target:{value:'Keep my arrival question'}});
 const older=screen.getByRole('button',{name:'Load older messages'});act(()=>{fireEvent.click(older);fireEvent.click(older);});await screen.findByText('Middle page');fireEvent.click(screen.getByRole('button',{name:'Load older messages'}));await screen.findByText('Oldest page');expect(screen.queryByRole('button',{name:'Load older messages'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'View newer messages'}));await screen.findByText('Middle page');expect(screen.getByLabelText('Message to the appointment participants')).toHaveValue('Keep my arrival question');
 fireEvent.click(screen.getByRole('button',{name:'View newer messages'}));await screen.findByText('Latest page');expect(screen.queryByRole('button',{name:'View newer messages'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Load older messages'}));await screen.findByText('Middle page');fireEvent.click(screen.getByRole('button',{name:'View latest messages'}));await screen.findByText('Latest page');expect(screen.queryByRole('button',{name:'View newer messages'})).not.toBeInTheDocument();expect(screen.getByLabelText('Message to the appointment participants')).toHaveValue('Keep my arrival question');
});

});
