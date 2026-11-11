import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { licenseStoragePath, licenseBelongsToApplicant, uploadVeterinaryLicense } from '@/lib/services/license-service';
const mocks = vi.hoisted(() => ({ upload:vi.fn(), remove:vi.fn(), from:vi.fn(), update:vi.fn(), single:vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase:{ from:mocks.from, storage:{from:()=>({upload:mocks.upload,remove:mocks.remove})} } }));
const uid='f1111111-1111-4111-8111-111111111111';
beforeEach(()=>{
 vi.clearAllMocks();vi.stubGlobal('crypto',{randomUUID:()=> 'f2222222-2222-4222-8222-222222222222'});
 mocks.upload.mockResolvedValue({error:null});mocks.remove.mockResolvedValue({error:null});mocks.single.mockResolvedValue({data:{id:'profile'},error:null});
 const chain={eq:vi.fn(),select:vi.fn(),single:mocks.single};chain.eq.mockReturnValue(chain);chain.select.mockReturnValue(chain);mocks.update.mockReturnValue(chain);mocks.from.mockReturnValue({update:mocks.update});
});
afterEach(()=>vi.unstubAllGlobals());
describe('veterinary license submission',()=>{
 it('uploads a distinct private object and leaves verification fields to the database',async()=>{
  await uploadVeterinaryLicense(uid,'profile',new File(['pdf'],'license.pdf',{type:'application/pdf'}),'VCN-123');
  expect(mocks.upload).toHaveBeenCalledWith(`${uid}/f2222222-2222-4222-8222-222222222222.pdf`,expect.any(File),{upsert:false});
  expect(mocks.update).toHaveBeenCalledWith({license_url:`${uid}/f2222222-2222-4222-8222-222222222222.pdf`,license_number:'VCN-123'});
 });
 it('removes an orphan upload when attaching it to the profile fails',async()=>{
  mocks.single.mockResolvedValue({data:null,error:new Error('denied')});
  await expect(uploadVeterinaryLicense(uid,'profile',new File(['pdf'],'x.pdf',{type:'application/pdf'}),'VCN-123')).rejects.toThrow('denied');
  expect(mocks.remove).toHaveBeenCalledOnce();
 });
 it('resolves old signed URLs to a path while refusing other hosts and path traversal',()=>{
  expect(licenseStoragePath(`https://fxvctkfhitpgfyaztqor.supabase.co/storage/v1/object/sign/licenses/${uid}/license.pdf?token=expired`)).toBe(`${uid}/license.pdf`);
  expect(()=>licenseStoragePath(`https://evil.invalid/storage/v1/object/sign/licenses/${uid}/license.pdf`)).toThrow();
  expect(()=>licenseStoragePath(`${uid}/../other.pdf`)).toThrow();
  expect(licenseBelongsToApplicant(`${uid}/license.pdf`, 'another-user')).toBe(false);
  expect(licenseBelongsToApplicant(`${uid}/license.pdf`, uid)).toBe(true);
 });
});
