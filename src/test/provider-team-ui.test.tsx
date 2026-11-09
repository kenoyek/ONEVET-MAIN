import { fireEvent,render,screen,waitFor } from '@testing-library/react';
import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter,Route,Routes } from 'react-router-dom';
import { beforeEach,describe,expect,it,vi } from 'vitest';
const {members,pending,invite,update,revoke,invitations,workspaces,respond}=vi.hoisted(()=>({members:vi.fn(),pending:vi.fn(),invite:vi.fn(),update:vi.fn(),revoke:vi.fn(),invitations:vi.fn(),workspaces:vi.fn(),respond:vi.fn()}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=> <nav>Navigation</nav>}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'owner-id'}})}));
vi.mock('@/lib/services/provider-team-service',async original=>({...await original<typeof import('@/lib/services/provider-team-service')>(),providerTeamService:{members,pending,invite,update,revoke,invitations,workspaces,respond}}));
import {ProviderTeamManager} from '@/components/provider/ProviderTeamManager';
import TeamInvitations from '@/pages/provider/TeamInvitations';
function mount(element:React.ReactElement){const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={cache}><MemoryRouter><Routes><Route path="/" element={element}/><Route path="/provider/organization/our-clinic" element={<h1>Organization workspace</h1>}/></Routes></MemoryRouter></QueryClientProvider>);}
describe('Provider team controls',()=>{
 beforeEach(()=>{vi.clearAllMocks();members.mockResolvedValue([{id:'owner-member',user_id:'owner-id',display_name:'Owner',member_role:'owner',status:'active',version:1}]);pending.mockResolvedValue([]);invitations.mockResolvedValue([{id:'invite-id',version:1,organization_name:'Our clinic',provider_slug:'our-clinic',member_role:'staff',expires_at:new Date(Date.now()+86400000).toISOString()}]);workspaces.mockResolvedValue([]);});
 it('requires explicit disclosure acknowledgement before creating an invitation',async()=>{
  invite.mockResolvedValue('invite-id');mount(<ProviderTeamManager providerId="org-id" suspended={false}/>);fireEvent.change(await screen.findByLabelText('Recipient email'),{target:{value:'member@example.invalid'}});expect(screen.getByRole('button',{name:'Create invitation'})).toBeDisabled();fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Create invitation'}));await waitFor(()=>expect(invite).toHaveBeenCalledWith('org-id',{email:'member@example.invalid',role:'staff'}));expect(await screen.findByRole('status')).toHaveTextContent('No email was sent');
 });
 it('does not offer role or removal controls for the owner',async()=>{
  mount(<ProviderTeamManager providerId="org-id" suspended={false}/>);await screen.findByText('Owner · active');expect(screen.queryByRole('button',{name:'Suspend access'})).not.toBeInTheDocument();expect(screen.queryByLabelText('Role for Owner')).not.toBeInTheDocument();
 });
 it('retains invite details after a failed create for retry',async()=>{
  invite.mockRejectedValue({code:'offline'});mount(<ProviderTeamManager providerId="org-id" suspended={false}/>);fireEvent.change(await screen.findByLabelText('Recipient email'),{target:{value:'member@example.invalid'}});fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Create invitation'}));expect(await screen.findByRole('alert')).toHaveTextContent('try again');expect(screen.getByLabelText('Recipient email')).toHaveValue('member@example.invalid');
 });
 it('opens the permitted workspace after acceptance with the reviewed invite version',async()=>{
  respond.mockResolvedValue('org-id');mount(<TeamInvitations/>);fireEvent.click(await screen.findByRole('button',{name:'Accept invitation'}));await screen.findByRole('heading',{name:'Organization workspace'});expect(respond).toHaveBeenCalledWith(expect.objectContaining({id:'invite-id',version:1}),'accept');
 });
 it('shows permission errors without pretending acceptance succeeded',async()=>{
  respond.mockRejectedValue({code:'42501'});mount(<TeamInvitations/>);fireEvent.click(await screen.findByRole('button',{name:'Accept invitation'}));expect(await screen.findByRole('alert')).toHaveTextContent('verified email');expect(screen.queryByRole('heading',{name:'Organization workspace'})).not.toBeInTheDocument();
 });
});
