import {act, cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
const fixture = vi.hoisted(() => ({type:'both', fail:false, failedTable:'', mismatch:false, role:'pet_owner', phone:'08012345678', counts:{pets:1, livestock_farms:0, provider_organizations:0} as Record<string,number>}));
vi.mock('@/lib/auth-context', () => ({useAuth: () => ({user:{id:'user'}, role:fixture.role, profile:{id:'profile', user_id:fixture.mismatch ? 'other' : 'user', is_active:true, first_name:'Ada', last_name:'Obi', phone:fixture.phone, customer_type:fixture.type}})}));
vi.mock('@/lib/feature-flags', () => ({isFeatureEnabled: () => true}));
vi.mock('@/integrations/supabase/client', () => ({supabase:{from:(table:string) => ({select:() => ({eq:() => Promise.resolve({count:fixture.counts[table], error:fixture.fail || fixture.failedTable===table ? new Error('offline') : null})})})}}));
import {AccountNextSteps} from '@/components/onboarding/AccountNextSteps';
function mount() {render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><AccountNextSteps/></MemoryRouter></QueryClientProvider>);}
beforeEach(() => {fixture.type='both'; fixture.fail=false; fixture.failedTable=''; fixture.mismatch=false; fixture.role='pet_owner'; fixture.phone='08012345678'; fixture.counts={pets:1, livestock_farms:0, provider_organizations:0};});
afterEach(cleanup);
it('keeps pet and farm setup separate for mixed owners and offers shopping immediately', async () => {
 mount(); expect(await screen.findByText('2 of 3 setup steps complete')).toBeInTheDocument();
 expect(within(screen.getByRole('link',{name:/Manage your pets/})).getByText('Complete')).toBeInTheDocument();
 expect(within(screen.getByRole('link',{name:/Add your farm/})).getByText(/Ready when you are/)).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Explore the marketplace'})).toHaveAttribute('href','/marketplace');
});
it('shows lookup failures honestly and recovers with retry', async () => {
 fixture.fail=true; mount(); await screen.findByText('Some setup steps could not be checked.');
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

it('keeps verified pet progress when farm lookup fails and retries without inventing farm completion', async () => {
 fixture.failedTable='livestock_farms'; mount(); await screen.findByText('Some setup steps could not be checked.');
 expect(within(screen.getByRole('link',{name:/Manage your pets/})).getByText('Complete')).toBeInTheDocument();
 expect(within(screen.getByRole('link',{name:/Check your farm records/})).getByText(/Not verified/)).toBeInTheDocument();
 fixture.failedTable=''; fixture.counts.livestock_farms=1; fireEvent.click(screen.getByRole('button',{name:'Retry setup check'}));
 await screen.findByText('Your care setup is ready'); expect(screen.getByText('3 of 3 setup steps complete')).toBeInTheDocument();
});
it('routes unknown pet counts to saved records rather than adding duplicates', async () => {
 fixture.type='pet_owner'; fixture.failedTable='pets'; mount(); await screen.findByText('Some setup steps could not be checked.');
 expect(screen.getByRole('link',{name:/Check your pet records/})).toHaveAttribute('href','/pets');
 expect(screen.queryByText('Your care setup is ready')).not.toBeInTheDocument();
});
it('offers adding a pet only when its absence has been checked', async () => {
 fixture.type='pet_owner'; fixture.counts.pets=0; mount(); await screen.findByText('1 of 2 setup steps complete');
 expect(screen.getByRole('link',{name:/Add your first pet/})).toHaveAttribute('href','/pets/new');
});
it('does not treat missing count metadata as a verified empty record list', async () => {
 fixture.type='pet_owner'; delete fixture.counts.pets; mount(); await screen.findByText('Some setup steps could not be checked.');
 expect(screen.getByRole('link',{name:/Check your pet records/})).toHaveAttribute('href','/pets');
});

it('keeps contact setup incomplete for phone text with letters and otherwise sufficient digits',async()=>{
 fixture.type='pet_owner';fixture.phone='Call 07052398371';mount();await screen.findByText('1 of 2 setup steps complete');
 expect(screen.getByRole('link',{name:/Complete your contact details/})).toHaveAttribute('href','/profile');expect(screen.queryByText('Your care setup is ready')).not.toBeInTheDocument();
});

it('waits for fresh counts before offering creation from a cached empty setup', async () => {
 fixture.type='pet_owner'; fixture.counts.pets=1;
 const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});
 const key=['onboarding-record-count','user','profile',false,false,true];
 cache.setQueryData(key,{animals:0,farms:0,businesses:0});
 let release!:()=>void;
 // Hold the actual record check so cached empty results remain in flight.
 const {supabase}=await import('@/integrations/supabase/client');
 const from=vi.spyOn(supabase,'from').mockImplementation(()=>({select:()=>({eq:()=>new Promise(resolve=>{release=()=>resolve({count:1,error:null});})})}) as never);
 try{
 render(<QueryClientProvider client={cache}><MemoryRouter><AccountNextSteps/></MemoryRouter></QueryClientProvider>);
 expect(screen.getByText('Checking your setup progress…')).toBeInTheDocument();expect(screen.queryByRole('link',{name:/Add your first pet/})).not.toBeInTheDocument();expect(screen.getByRole('link',{name:/Check your pet records/})).toHaveAttribute('href','/pets');
 await act(async()=>release());
 expect(await screen.findByText('Your care setup is ready')).toBeInTheDocument();expect(screen.getByRole('link',{name:/Manage your pets/})).toHaveAttribute('href','/pets');
 }finally{from.mockRestore();}
});
