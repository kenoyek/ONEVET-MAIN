import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({query:vi.fn(),payment:vi.fn(),subscription:vi.fn()}));
vi.mock('@/lib/feature-flags',()=>({isFeatureEnabled:()=>false}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:null})}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
vi.mock('@/components/layout/Footer',()=>({Footer:()=>null}));
vi.mock('@/hooks/use-paystack',()=>({usePaystack:mocks.payment}));
vi.mock('@/hooks/useSubscription',()=>({useSubscription:mocks.subscription}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:()=>({select:()=>({eq:()=>({order:mocks.query})})})}}));
import Pricing from '@/pages/Pricing';
import {membershipFeatures,membershipPrice,membershipTerm} from '@/lib/membership-display';
function mount(){render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><Pricing/></MemoryRouter></QueryClientProvider>);}
beforeEach(()=>{vi.clearAllMocks();mocks.query.mockResolvedValue({data:[],error:null});});
afterEach(cleanup);
it('offers a free account and provider care without loading payment or subscription hooks',async()=>{
 mount();await screen.findByText('No memberships are listed right now.');
 expect(screen.getByRole('link',{name:/Create your free account/})).toHaveAttribute('href','/auth?mode=signup');
 expect(screen.getByText('Online payments are currently unavailable')).toBeInTheDocument();
 expect(mocks.payment).not.toHaveBeenCalled();expect(mocks.subscription).not.toHaveBeenCalled();
 expect(screen.queryByText('Activate Plan')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Can I pay for a membership now?'}));
 expect(await screen.findByText(/Listed plans are for information only/)).toBeInTheDocument();
});
it('shows actual plan periods and currency without invented badges or activation',async()=>{
 mocks.query.mockResolvedValue({data:[{id:'plan',name:'Quarterly care',price:120,currency:'USD',duration_months:3,description:'Listed test details',features:['Review the stated limits',{fake:'not text'}]}],error:null});
 mount();await screen.findByText('Quarterly care');expect(screen.getByText('per 3 months')).toBeInTheDocument();
 expect(screen.getByText(/\$120/)).toBeInTheDocument();expect(screen.getByText('Review the stated limits')).toBeInTheDocument();
 expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();expect(screen.queryByText('Best Value')).not.toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Ask about this membership'})).toHaveAttribute('href','/contact');
});
it('distinguishes failed plan loading from an empty list and recovers with retry',async()=>{
 mocks.query.mockResolvedValueOnce({data:null,error:new Error('offline')}).mockResolvedValue({data:[],error:null});mount();
 expect(await screen.findByRole('alert')).toHaveTextContent('Membership details could not be loaded.');
 expect(screen.queryByText('No memberships are listed right now.')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Retry memberships'}));await screen.findByText('No memberships are listed right now.');
});
it('handles unknown benefits and invalid price metadata without misleading display',()=>{
 expect(membershipFeatures({unconfirmed:true})).toEqual(['Confirm included benefits and limits with support.']);
 expect(membershipPrice(-1,'NGN')).toBe('Confirm price with support');expect(membershipPrice(5,'bad-currency')).toContain('Confirm');
 expect(membershipTerm(24)).toBe('per 24 months');expect(membershipTerm(0)).toContain('Confirm');
});
