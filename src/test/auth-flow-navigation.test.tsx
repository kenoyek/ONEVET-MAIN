import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter,Route,Routes,useLocation} from 'react-router-dom';
import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({user:null as null|{id:string},role:null as string|null,roles:[] as string[],loading:false,passwordRecovery:false,permissionsError:false}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>mock}));
vi.mock('@/components/auth/SignInForm',()=>({SignInForm:({onForgotPassword}:{onForgotPassword:()=>void})=><button onClick={onForgotPassword}>Forgot password?</button>}));
vi.mock('@/components/auth/SignUpForm',()=>({SignUpForm:()=> <p>Owner registration form</p>}));
vi.mock('@/components/auth/ProviderSignUpForm',()=>({ProviderSignUpForm:()=> <p>Provider registration form</p>}));
vi.mock('@/components/auth/PasswordResetForm',()=>({PasswordResetForm:()=> <p>Recovery request form</p>}));
vi.mock('@/components/auth/NewPasswordForm',()=>({NewPasswordForm:()=> <p>New password form</p>}));
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
function Destination(){const location=useLocation();return <p>Destination: {location.pathname+location.search+location.hash}</p>;}
function mount(callback=false,from=false,search=''){const wrapper=({children}:{children:React.ReactNode})=><MemoryRouter initialEntries={[{pathname:callback?'/auth/callback':'/auth',search,state:from?{from:{pathname:'/booking/new',search:'?service_id=service-a',hash:'#details'}}:null}]}><Routes><Route path={callback?'/auth/callback':'/auth'} element={children}/><Route path="*" element={<Destination/>}/></Routes></MemoryRouter>;return render(callback?<AuthCallback/>:<Auth/>,{wrapper});}
beforeEach(()=>{Object.assign(mock,{user:null,role:null,roles:[],loading:false,passwordRecovery:false,permissionsError:false});window.history.replaceState({},'','/');});
describe('Authentication navigation',()=>{
 it('waits for the database role before choosing the correct portal',async()=>{mock.user={id:'admin-a'};const view=mount();expect(screen.getByText('Opening your account…')).toBeInTheDocument();expect(screen.queryByText(/Destination:/)).not.toBeInTheDocument();mock.role='admin';view.rerender(<Auth/>);await screen.findByText('Destination: /admin');});
 it('preserves the requested care route after switching to registration and back',async()=>{const view=mount(false,true);fireEvent.mouseDown(screen.getByRole('tab',{name:'Create account'}),{button:0,ctrlKey:false});await waitFor(()=>expect(screen.getByRole('tab',{name:'Create account'})).toHaveAttribute('data-state','active'));fireEvent.mouseDown(screen.getByRole('tab',{name:'Sign in'}),{button:0,ctrlKey:false});mock.user={id:'owner-a'};mock.role='pet_owner';view.rerender(<Auth/>);await screen.findByText('Destination: /booking/new?service_id=service-a#details');});
 it('opens recovery requests directly from their URL',async()=>{mount(false,false,'?mode=recover');await screen.findByText('Recovery request form');});
 it('keeps an authenticated recovery user in the password form',async()=>{mock.user={id:'owner-a'};mock.role='pet_owner';mock.passwordRecovery=true;mount(false,false,'?mode=reset');await screen.findByText('New password form');expect(screen.queryByText(/Destination:/)).not.toBeInTheDocument();});
 it('routes SDK recovery callbacks to password update before roles finish loading',async()=>{mock.user={id:'owner-a'};mock.passwordRecovery=true;mount(true);await screen.findByText('Destination: /auth?mode=reset');});
 it('waits for roles on an ordinary confirmation callback',async()=>{mock.user={id:'vet-a'};const view=mount(true);expect(screen.getByText('Confirming your account…')).toBeInTheDocument();mock.role='veterinarian';view.rerender(<AuthCallback/>);await screen.findByText('Destination: /vet-dashboard');});
 it('explains expired callback links without displaying raw URL errors',()=>{window.history.replaceState({},'','/auth/callback#error=access_denied&error_description=PRIVATE_ERROR');mount(true);expect(screen.getByRole('alert')).toHaveTextContent('This account link is unavailable');expect(screen.getByRole('link',{name:'Request a new reset link'})).toHaveAttribute('href','/auth?mode=recover');expect(screen.queryByText('PRIVATE_ERROR')).not.toBeInTheDocument();});
});

it('chooses the admin portal when an owner role is returned first',async()=>{mock.user={id:'admin-a'};mock.role='pet_owner';mock.roles=['pet_owner','admin'];mount();await screen.findByText('Destination: /admin');});
it('uses the same portal priority on confirmation callbacks',async()=>{mock.user={id:'admin-a'};mock.role='pet_owner';mock.roles=['pet_owner','admin'];mount(true);await screen.findByText('Destination: /admin');});

it('lets signed-in administrators explicitly request a password reset without redirecting them away',async()=>{mock.user={id:'admin-a'};mock.role='admin';mount(false,false,'?mode=recover');await screen.findByText('Recovery request form');expect(screen.queryByText(/Destination:/)).not.toBeInTheDocument();});
