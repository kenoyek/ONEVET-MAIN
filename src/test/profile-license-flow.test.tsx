import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Profile from '@/pages/Profile';
const mocks=vi.hoisted(()=>({profile:{id:'profile-a',user_id:'user-a',first_name:'Test',last_name:'Vet',phone:'',email:'vet@example.invalid',location:'',license_number:'',license_url:null as string|null,license_verified:false,verification_status:'pending'},upload:vi.fn(),refresh:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'user-a'},profile:mocks.profile,role:'veterinarian',refreshProfile:mocks.refresh})}));
vi.mock('@/lib/services/license-service',()=>({uploadVeterinaryLicense:mocks.upload}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{}}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
beforeEach(()=>{vi.clearAllMocks();mocks.profile={...mocks.profile,id:'profile-a',first_name:'Test',last_name:'Vet',phone:'',license_number:'',license_url:null};mocks.upload.mockResolvedValue(undefined);mocks.refresh.mockResolvedValue(undefined);});
afterEach(cleanup);
describe('profile license completion',()=>{
 it('attaches the entered license number and preserves unsaved contact details across refresh',async()=>{
  const view=render(<MemoryRouter><Profile/></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Phone Number'),{target:{value:'+2347052398371'}});
  fireEvent.change(screen.getByLabelText('License ID (VCN)'),{target:{value:'VCN-new'}});
  const file=new File(['fixture'],'license.pdf',{type:'application/pdf'});
  fireEvent.change(view.container.querySelector('input[type=file][accept*=pdf]')!,{target:{files:[file]}});
  await waitFor(()=>expect(mocks.upload).toHaveBeenCalledWith('user-a','profile-a',file,'VCN-new'));
  await waitFor(()=>expect(mocks.refresh).toHaveBeenCalled());
  mocks.profile={...mocks.profile,license_number:'VCN-new',license_url:'user-a/new.pdf'};
  view.rerender(<MemoryRouter><Profile/></MemoryRouter>);
  expect(screen.getByLabelText('Phone Number')).toHaveValue('+2347052398371');
  expect(screen.getByLabelText('License ID (VCN)')).toHaveValue('VCN-new');
 });
 it('does not upload a document until its license number is entered',()=>{
  const view=render(<MemoryRouter><Profile/></MemoryRouter>);
  fireEvent.change(view.container.querySelector('input[type=file][accept*=pdf]')!,{target:{files:[new File(['fixture'],'license.pdf',{type:'application/pdf'})]}});
  expect(mocks.upload).not.toHaveBeenCalled();
 });
});
