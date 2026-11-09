import {act,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({user:'owner-a',users:{'owner-a':{id:'owner-a'},'owner-b':{id:'owner-b'}},passport:vi.fn(),limit:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:mock.users[mock.user as keyof typeof mock.users],profile:null})}));
vi.mock('@/lib/services/pet-passport-service',()=>({petPassportService:{getPetPassport:mock.passport}}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=> <nav>Navigation</nav>}));
vi.mock('@/components/pets/PetHealthJournal',()=>({PetHealthJournal:()=> <div>Owner health journal</div>}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:()=>({select:()=>({eq:()=>({order:()=>({limit:mock.limit})})})})}}));
import PetDetail from '@/pages/pets/PetDetail';
const passport=(name:string)=>({pet:{id:'pet-a',name,species:'dog',owner_id:'profile-a'},advancedAvailable:false});
function mount(){return render(<PetDetail/>,{wrapper:({children})=><MemoryRouter initialEntries={['/pets/pet-a']}><Routes><Route path="/pets/:id" element={children}/></Routes></MemoryRouter>});}
describe('Pet profile account isolation',()=>{
 beforeEach(()=>{vi.clearAllMocks();mock.user='owner-a';mock.limit.mockResolvedValue({data:[],error:null});});
 it('ignores a previous account pet response after an account switch',async()=>{let release!:(value:unknown)=>void;mock.passport.mockImplementation(()=>mock.user==='owner-a'?new Promise(resolve=>{release=resolve;}):Promise.resolve(passport('Current account pet')));const view=mount();await waitFor(()=>expect(mock.passport).toHaveBeenCalled());mock.user='owner-b';view.rerender(<PetDetail/>);await screen.findByRole('heading',{name:'Current account pet'});await act(async()=>release(passport('PRIVATE OLD PET')));expect(screen.queryByText('PRIVATE OLD PET')).not.toBeInTheDocument();});
 it('removes loaded previous-account content immediately during a new account load',async()=>{mock.passport.mockResolvedValueOnce(passport('Previous account pet')).mockImplementation(()=>new Promise(()=>{}));const view=mount();await screen.findByRole('heading',{name:'Previous account pet'});mock.user='owner-b';view.rerender(<PetDetail/>);expect(screen.queryByRole('heading',{name:'Previous account pet'})).not.toBeInTheDocument();});
 it('shows a retryable error instead of a blank pet page',async()=>{mock.passport.mockRejectedValue(new Error('Network'));mount();expect(await screen.findByRole('alert')).toHaveTextContent('Pet profile unavailable');expect(screen.getByRole('button',{name:'Retry pet profile'})).toBeInTheDocument();});
 it('does not present a consultation fetch error as no consultations',async()=>{mock.passport.mockResolvedValue(passport('Current pet'));mock.limit.mockResolvedValue({data:null,error:{code:'42501'}});mount();await screen.findByRole('heading',{name:'Current pet'});expect(await screen.findByRole('alert')).toHaveTextContent('Could not load recent consultations');expect(screen.queryByText(/No consultations recorded/)).not.toBeInTheDocument();});
});
