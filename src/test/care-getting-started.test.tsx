import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const flag=vi.hoisted(()=>({enabled:true}));
vi.mock('@/lib/feature-flags',()=>({isFeatureEnabled:()=>flag.enabled}));
import {CareGettingStarted} from '@/components/landing/CareGettingStarted';
function mount(farm:boolean){render(<MemoryRouter><CareGettingStarted farm={farm}/></MemoryRouter>);}
beforeEach(()=>{flag.enabled=true;});afterEach(cleanup);
it('guides pet owners to profiles and explains journal limits',async()=>{
 mount(false);expect(screen.getByRole('link',{name:'Add your first pet'})).toHaveAttribute('href','/pets/new');
 expect(new URL(screen.getByRole('link',{name:'Browse pet essentials'}).getAttribute('href')!,'https://1vet.store').searchParams.get('category')).toBe('Pet Food');
 fireEvent.click(screen.getByRole('button',{name:'Does the health journal send reminders?'}));
 expect(await screen.findByText(/does not send automatic reminders/)).toBeInTheDocument();
});
it('guides farmers to groups and eligible appointment requests',async()=>{
 mount(true);expect(screen.getByRole('link',{name:'Start your farm record'})).toHaveAttribute('href','/farms');
 expect(screen.getByRole('link',{name:'Open farm groups'})).toHaveAttribute('href','/farms');
 expect(new URL(screen.getByRole('link',{name:'Browse farm supplies'}).getAttribute('href')!,'https://1vet.store').searchParams.get('category')).toBe('Livestock');
 fireEvent.click(screen.getByRole('button',{name:'Can I request an appointment for a group?'}));
 expect(await screen.findByText(/provider must confirm the request/)).toBeInTheDocument();
});
it('routes to support when farm records are disabled',()=>{
 flag.enabled=false;mount(true);expect(screen.getByRole('link',{name:'Ask about farm records'})).toHaveAttribute('href','/contact');
 expect(screen.queryByRole('link',{name:'Open farm groups'})).not.toBeInTheDocument();
});
