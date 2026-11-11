import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailConfirmationForm } from '@/components/auth/EmailConfirmationForm';
const mock=vi.hoisted(()=>({resend:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{auth:{resend:mock.resend}}}));
beforeEach(()=>{mock.resend.mockReset();mock.resend.mockResolvedValue({error:null});});
afterEach(()=>{cleanup();vi.useRealTimers();});
function mount(){return render(<MemoryRouter initialEntries={[{pathname:'/auth',search:'?mode=confirm',state:{confirmationEmail:'owner@example.invalid'}}]}><EmailConfirmationForm onBack={()=>{}}/></MemoryRouter>);}
describe('signup confirmation recovery',()=>{
 it('validates an email without sending a request for incomplete input',()=>{
  const {container}=mount();fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'invalid'}});fireEvent.submit(container.querySelector('form')!);
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');expect(mock.resend).not.toHaveBeenCalled();
 });
 it('requests a signup link through the allowed callback and enforces a cooldown',async()=>{
  vi.useFakeTimers();const {container}=mount();
  fireEvent.submit(container.querySelector('form')!);
  await act(async()=>{await Promise.resolve();});
  expect(mock.resend).toHaveBeenCalledWith({type:'signup',email:'owner@example.invalid',options:{emailRedirectTo:window.location.origin+'/auth/callback'}});
  expect(screen.getByRole('status')).toHaveTextContent('If this address needs confirmation');
  expect(screen.getByRole('button',{name:'Send confirmation link'})).toBeDisabled();
  fireEvent.submit(container.querySelector('form')!);expect(mock.resend).toHaveBeenCalledTimes(1);
  act(()=>vi.advanceTimersByTime(60_000));
  expect(screen.getByRole('button',{name:'Send confirmation link'})).toBeEnabled();
 });
 it('blocks repeated pending requests and reports failures without claiming delivery',async()=>{
  let finish!:(value:unknown)=>void;mock.resend.mockReturnValue(new Promise(resolve=>{finish=resolve;}));
  const {container}=mount();fireEvent.submit(container.querySelector('form')!);fireEvent.submit(container.querySelector('form')!);
  expect(mock.resend).toHaveBeenCalledTimes(1);
  await act(async()=>finish({error:new Error('rate limited')}));
  expect(screen.getByRole('alert')).toHaveTextContent('We couldn’t request another link.');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();expect(screen.getByLabelText('Email address')).toHaveValue('owner@example.invalid');
 });
});
