import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({signIn:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({signIn:mock.signIn})}));
import {SignInForm} from '@/components/auth/SignInForm';
beforeEach(()=>{vi.clearAllMocks();mock.signIn.mockResolvedValue({error:null});});
describe('Sign-in experience',()=>{
 it('names password visibility and preserves the typed value when toggling',()=>{render(<SignInForm onForgotPassword={()=>{}}/>);const password=screen.getByLabelText('Password');fireEvent.change(password,{target:{value:'example-password'}});fireEvent.click(screen.getByRole('button',{name:'Show password'}));expect(password).toHaveAttribute('type','text');expect(password).toHaveValue('example-password');expect(screen.getByRole('button',{name:'Hide password'})).toHaveAttribute('aria-pressed','true');fireEvent.click(screen.getByRole('button',{name:'Hide password'}));expect(password).toHaveAttribute('type','password');});
 it('provides a clear recovery control without submitting credentials',()=>{const recover=vi.fn();render(<SignInForm onForgotPassword={recover}/>);fireEvent.click(screen.getByRole('button',{name:'Forgot password?'}));expect(recover).toHaveBeenCalledOnce();expect(mock.signIn).not.toHaveBeenCalled();});
 it('retains the existing sign-in contract with familiar labels',async()=>{render(<SignInForm onForgotPassword={()=>{}}/>);fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'owner@example.invalid'}});fireEvent.change(screen.getByLabelText('Password'),{target:{value:'example-password'}});fireEvent.click(screen.getByRole('button',{name:'Sign in'}));await waitFor(()=>expect(mock.signIn).toHaveBeenCalledWith('owner@example.invalid','example-password'));});
});
