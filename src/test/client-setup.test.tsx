import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
const fixture = vi.hoisted(() => ({type:'both', fail:false, mismatch:false, role:'pet_owner', phone:'08012345678', counts:{pets:1, livestock_farms:0, provider_organizations:0} as Record<string,number>}));
vi.mock('@/lib/auth-context', () => ({useAuth: () => ({user:{id:'user'}, role:fixture.role, profile:{id:'profile', user_id:fixture.mismatch ? 'other' : 'user', is_active:true, first_name:'Ada', last_name:'Obi', phone:fixture.phone, customer_type:fixture.type}})}));
vi.mock('@/lib/feature-flags', () => ({isFeatureEnabled: () => true}));
vi.mock('@/integrations/supabase/client', () => ({supabase:{from:(table:string) => ({select:() => ({eq:() => Promise.resolve({count:fixture.counts[table], error:fixture.fail ? new Error('offline') : null})})})}}));
import {AccountNextSteps} from '@/components/onboarding/AccountNextSteps';
function mount() {render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><AccountNextSteps/></MemoryRouter></QueryClientProvider>);}
beforeEach(() => {fixture.type='both'; fixture.fail=false; fixture.mismatch=false; fixture.role='pet_owner'; fixture.phone='08012345678'; fixture.counts={pets:1, livestock_farms:0, provider_organizations:0};});
afterEach(cleanup);
it('keeps pet and farm setup separate for mixed owners and offers shopping immediately', async () => {
 mount(); expect(await screen.findByText('2 of 3 setup steps complete')).toBeInTheDocument();
 expect(within(screen.getByRole('link',{name:/Add your first pet/})).getByText('Complete')).toBeInTheDocument();
 expect(within(screen.getByRole('link',{name:/Add your farm/})).getByText(/Ready when you are/)).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Explore the marketplace'})).toHaveAttribute('href','/marketplace');
});
it('shows lookup failures honestly and recovers with retry', async () => {
 fixture.fail=true; mount(); await screen.findByText('Setup progress could not be checked.');
 expect(screen.queryByText('2 of 3 setup steps complete')).not.toBeInTheDocument();
 fixture.fail=false; fireEvent.click(screen.getByRole('button',{name:'Retry setup check'}));
 expect(await screen.findByText('2 of 3 setup steps complete')).toBeInTheDocument();
});
it('uses farm-only setup for legacy livestock owners and does not accept an invalid phone', async () => {
 fixture.type='livestock_owner'; fixture.phone='x'; fixture.counts.livestock_farms=1; mount();
 expect(await screen.findByText('1 of 2 setup steps complete')).toBeInTheDocument();
 expect(screen.queryByText('Add your first pet')).not.toBeInTheDocument();
});
it('does not show a previous account’s setup', () => {
 fixture.mismatch=true; mount(); expect(screen.queryByRole('region',{name:'Getting started'})).not.toBeInTheDocument();
});
it('keeps business setup and approval messaging for providers', async () => {
 fixture.role='service_provider'; fixture.counts.provider_organizations=1; mount();
 await screen.findByText('2 of 2 setup steps complete');
 expect(screen.getByText(/Approval is required before publishing/)).toBeInTheDocument();
 expect(screen.queryByRole('link',{name:'Explore the marketplace'})).not.toBeInTheDocument();
});
