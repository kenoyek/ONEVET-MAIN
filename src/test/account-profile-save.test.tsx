import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({user:{id:'user-a',email:'a@example.invalid'},profile:{id:'profile-a',user_id:'user-a',first_name:'Ada',last_name:'Obi',phone:'08012345678'},single:vi.fn(),update:vi.fn(),eq:vi.fn(),refresh:vi.fn(),success:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:mock.user,profile:mock.profile,role:'pet_owner',refreshProfile:mock.refresh})}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:()=>({update:mock.update})}}));
vi.mock('sonner',()=>({toast:{success:mock.success,error:vi.fn()}}));
import Profile from '@/pages/Profile';
function view(){return <MemoryRouter><Profile/></MemoryRouter>;}
beforeEach(()=>{vi.clearAllMocks();mock.user={id:'user-a',email:'a@example.invalid'};mock.profile={id:'profile-a',user_id:'user-a',first_name:'Ada',last_name:'Obi',phone:'08012345678'};const query={eq:mock.eq,select:()=>({single:mock.single})};mock.eq.mockReturnValue(query);mock.update.mockReturnValue(query);mock.refresh.mockResolvedValue(undefined);});
afterEach(cleanup);
it('does not claim success for a write that returns no owned row',async()=>{
 mock.single.mockResolvedValue({data:null,error:null});render(view());fireEvent.change(screen.getByLabelText('First Name'),{target:{value:'Ada updated'}});fireEvent.click(screen.getByRole('button',{name:'Save profile'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t confirm');expect(screen.getByLabelText('First Name')).toHaveValue('Ada updated');expect(mock.success).not.toHaveBeenCalled();expect(mock.refresh).not.toHaveBeenCalled();
 expect(mock.eq).toHaveBeenCalledWith('id','profile-a');expect(mock.eq).toHaveBeenCalledWith('user_id','user-a');
});
it('saves once while pending and keeps edits made after the submitted snapshot unsaved',async()=>{
 let finish!:(value:unknown)=>void;mock.single.mockReturnValue(new Promise(resolve=>{finish=resolve;}));render(view());
 fireEvent.click(screen.getByRole('button',{name:'Save profile'}));fireEvent.click(screen.getByRole('button',{name:'Saving Changes'}));expect(mock.update).toHaveBeenCalledTimes(1);
 fireEvent.change(screen.getByLabelText('Phone Number'),{target:{value:'07000000000'}});finish({data:{id:'profile-a'},error:null});
 expect(await screen.findByText('Submitted changes were saved. Newer edits are still unsaved.')).toBeInTheDocument();expect(screen.getByLabelText('Phone Number')).toHaveValue('07000000000');
});
it('drops the old draft and ignores pending save feedback after an account switch',async()=>{
 let finish!:(value:unknown)=>void;mock.single.mockReturnValue(new Promise(resolve=>{finish=resolve;}));const rendered=render(view());fireEvent.change(screen.getByLabelText('First Name'),{target:{value:'Private draft'}});fireEvent.click(screen.getByRole('button',{name:'Save profile'}));
 mock.user={id:'user-b',email:'b@example.invalid'};rendered.rerender(view());expect(screen.getByRole('status')).toHaveTextContent('Checking your account profile');expect(screen.queryByLabelText('First Name')).not.toBeInTheDocument();
 await act(async()=>{finish({data:{id:'profile-a'},error:null});});expect(mock.refresh).not.toHaveBeenCalled();expect(mock.success).not.toHaveBeenCalled();
 mock.profile={id:'profile-b',user_id:'user-b',first_name:'Bola',last_name:'Ade',phone:''};rendered.rerender(view());await waitFor(()=>expect(screen.getByLabelText('First Name')).toHaveValue('Bola'));
});
