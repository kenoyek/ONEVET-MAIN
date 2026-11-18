import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({signIn:vi.fn(),resend:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({signIn:mock.signIn})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{auth:{resend:mock.resend}}}));
import { SignInForm } from '@/components/auth/SignInForm';
import { EmailConfirmationForm } from '@/components/auth/EmailConfirmationForm';
function Flow(){const location=useLocation();return new URLSearchParams(location.search).get('mode')==='confirm'?<><EmailConfirmationForm onBack={()=>{}}/><p data-testid="return-state">{JSON.stringify(location.state)}</p></>:<SignInForm onForgotPassword={()=>{}}/>;}
function mount(){render(<MemoryRouter initialEntries={[{pathname:'/auth',search:'?role=farm_owner',state:{from:{pathname:'/booking/new',search:'?service_id=service-one',hash:'#details'}}}]}><Flow/></MemoryRouter>);}
async function submit(){fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'owner@example.invalid'}});fireEvent.change(screen.getByLabelText('Password'),{target:{value:'ExamplePass1'}});fireEvent.click(screen.getByRole('button',{name:'Sign in'}));await screen.findByRole('alert');}
beforeEach(()=>{vi.clearAllMocks();mock.signIn.mockResolvedValue({error:{code:'email_not_confirmed'}});mock.resend.mockResolvedValue({error:null});});afterEach(cleanup);
it('opens editable confirmation recovery while preserving the intended destination and audience',async()=>{
 mount();await submit();const link=screen.getByRole('link',{name:'Request a confirmation link'});expect(link).toHaveAttribute('href','/auth?role=farm_owner&mode=confirm');
 fireEvent.click(link);expect(screen.getByLabelText('Email address')).toHaveValue('owner@example.invalid');expect(screen.getByTestId('return-state')).toHaveTextContent('service_id=service-one');expect(screen.getByTestId('return-state')).toHaveTextContent('#details');
 expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();expect(mock.resend).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Send confirmation link'}));await waitFor(()=>expect(mock.resend).toHaveBeenCalledOnce());
 expect(mock.resend).toHaveBeenCalledWith({type:'signup',email:'owner@example.invalid',options:{emailRedirectTo:window.location.origin+'/auth/callback'}});
});
it('does not offer confirmation recovery for an incorrect password or general failure',async()=>{
 mock.signIn.mockResolvedValue({error:{code:'invalid_credentials'}});mount();await submit();expect(screen.queryByRole('link',{name:'Request a confirmation link'})).not.toBeInTheDocument();
});
it('clears the previous confirmation address when the email is edited',async()=>{
 mount();await submit();expect(screen.getByRole('link',{name:'Request a confirmation link'})).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'different@example.invalid'}});expect(screen.queryByRole('link',{name:'Request a confirmation link'})).not.toBeInTheDocument();
});
it('supports older confirmation error messages without displaying raw server text',async()=>{
 mock.signIn.mockResolvedValue({error:{message:'Email not confirmed: INTERNAL_DETAIL'}});mount();await submit();expect(screen.getByRole('link',{name:'Request a confirmation link'})).toBeInTheDocument();expect(screen.queryByText(/INTERNAL_DETAIL/)).not.toBeInTheDocument();
});
