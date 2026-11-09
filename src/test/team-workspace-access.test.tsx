import { render,screen } from '@testing-library/react';
import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter,Route,Routes } from 'react-router-dom';
import { beforeEach,describe,expect,it,vi } from 'vitest';
const {access,get}=vi.hoisted(()=>({access:vi.fn(),get:vi.fn()}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=> <nav>Navigation</nav>}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'team-member'}})}));
vi.mock('@/lib/services/provider-draft-service',async original=>({...await original<typeof import('@/lib/services/provider-draft-service')>(),providerDraftService:{get}}));
vi.mock('@/lib/services/provider-team-service',()=>({providerTeamService:{access}}));
vi.mock('@/components/provider/ProviderVerificationPanel',()=>({ProviderVerificationPanel:()=> <p>Private verification controls</p>}));
vi.mock('@/components/provider/ProviderTeamManager',()=>({ProviderTeamManager:()=> <p>Owner team controls</p>}));
vi.mock('@/components/provider/ProviderServiceManager',()=>({ProviderServiceManager:()=> <p>Service controls</p>}));
vi.mock('@/components/provider/ProviderBookingManager',()=>({ProviderBookingManager:()=> <p>Booking controls</p>}));
import ProviderDraftWorkspace from '@/pages/provider/ProviderDraftWorkspace';
function mount(){const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={cache}><MemoryRouter initialEntries={['/provider/organization/our-clinic']}><Routes><Route path="/provider/organization/:slug" element={<ProviderDraftWorkspace/>}/></Routes></MemoryRouter></QueryClientProvider>);}
describe('Delegated workspace UI',()=>{
 beforeEach(()=>{vi.clearAllMocks();get.mockResolvedValue({organization:{id:'org-id',name:'Our clinic',slug:'our-clinic',created_by:'owner-id',verification_status:'approved',status:'active',provider_type:'grooming_business'},location:{name:'Primary'}});});
 it('shows coordinator booking tools without services or owner-only controls',async()=>{
  access.mockResolvedValue({workspace:true,services:false,bookings:true});mount();await screen.findByText('Booking controls');expect(screen.queryByText('Service controls')).not.toBeInTheDocument();expect(screen.queryByText('Private verification controls')).not.toBeInTheDocument();expect(screen.queryByText('Owner team controls')).not.toBeInTheDocument();
 });
 it('shows manager services but keeps team and verification administration owner-only',async()=>{
  access.mockResolvedValue({workspace:true,services:true,bookings:true});mount();await screen.findByText('Service controls');expect(screen.queryByText('Private verification controls')).not.toBeInTheDocument();expect(screen.queryByText('Owner team controls')).not.toBeInTheDocument();
 });
 it('does not retain operational tools when permission checks fail',async()=>{
  access.mockRejectedValue({code:'offline'});mount();await screen.findByRole('heading',{name:'Organization unavailable'});expect(screen.queryByText('Booking controls')).not.toBeInTheDocument();expect(screen.queryByText('Service controls')).not.toBeInTheDocument();
 });
});
