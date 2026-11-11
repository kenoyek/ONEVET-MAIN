import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { upload, prepare, from }=vi.hoisted(()=>({upload:vi.fn(),prepare:vi.fn(),from:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{storage:{from}}}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'auth-owner'},profile:{id:'profile-owner',user_id:'auth-owner'}})}));
vi.mock('@/lib/services/image-upload-service',()=>({prepareImage:prepare}));
import { PetPhotoUpload } from '@/components/pets/PetPhotoUpload';
const file=()=>new File(['png'],'pet.png',{type:'image/png'});
beforeEach(()=>{vi.clearAllMocks();prepare.mockResolvedValue(new Blob(['webp'],{type:'image/webp'}));from.mockReturnValue({upload,getPublicUrl:(path:string)=>({data:{publicUrl:'https://example.invalid/'+path}})});});
afterEach(cleanup);
describe('pet photo integrity',()=>{
 it('uses the auth user folder, unique immutable files and waits for profile attachment',async()=>{
  upload.mockResolvedValue({error:null});const attached=vi.fn().mockResolvedValue(undefined);render(<PetPhotoUpload currentUrl="https://example.invalid/old.webp" profileId="profile-owner" onUpload={attached}/>);
  fireEvent.change(screen.getByLabelText('Upload pet photo'),{target:{files:[file()]}});await waitFor(()=>expect(attached).toHaveBeenCalledOnce());
  expect(upload.mock.calls[0]![0]).toMatch(/^auth-owner\/.+\.webp$/);expect(upload.mock.calls[0]![2]).toMatchObject({upsert:false,contentType:'image/webp'});
 });
 it('retains the existing photo and blocks duplicate pending uploads on failure',async()=>{
  let finish!:(result:{error:Error})=>void;upload.mockReturnValue(new Promise(resolve=>{finish=resolve;}));const attached=vi.fn();render(<PetPhotoUpload currentUrl="https://example.invalid/old.webp" profileId="profile-owner" onUpload={attached}/>);
  const input=screen.getByLabelText('Upload pet photo');fireEvent.change(input,{target:{files:[file()]}});fireEvent.change(input,{target:{files:[file()]}});await waitFor(()=>expect(upload).toHaveBeenCalledTimes(1));finish({error:new Error('offline')});
  await screen.findByRole('alert');expect(screen.getByRole('img')).toHaveAttribute('src','https://example.invalid/old.webp');expect(attached).not.toHaveBeenCalled();
 });
 it('removes only the saved reference and reports attachment failures',async()=>{
  const remove=vi.fn().mockRejectedValue(new Error('Profile save failed'));render(<PetPhotoUpload currentUrl="https://example.invalid/old.webp" profileId="profile-owner" onUpload={vi.fn()} onRemove={remove}/>);
  fireEvent.click(screen.getByRole('button',{name:'Remove Photo'}));expect(await screen.findByRole('alert')).toHaveTextContent('Profile save failed');expect(from).not.toHaveBeenCalled();expect(screen.getByRole('img')).toHaveAttribute('src','https://example.invalid/old.webp');
 });
});
