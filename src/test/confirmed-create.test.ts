import { describe, expect, it, vi } from 'vitest';
import { confirmedCreate } from '@/lib/confirmed-create';
describe('confirmed record creation',()=>{
 it('requires a saved ID and propagates ordinary save failures',async()=>{
  const recover=vi.fn();await expect(confirmedCreate({data:null,error:null},recover,{})).rejects.toThrow('save could not be confirmed');
  const denied={code:'42501'};await expect(confirmedCreate({data:null,error:denied},recover,{})).rejects.toEqual(denied);expect(recover).not.toHaveBeenCalled();
 });
 it('recovers an identical record after duplicate-key retry without overwriting',async()=>{
  const record={id:'one',name:'Farm',owner_id:'owner'};const recover=vi.fn().mockResolvedValue({data:record,error:null});
  expect(await confirmedCreate({data:null,error:{code:'23505'}},recover,record)).toEqual(record);expect(recover).toHaveBeenCalledOnce();
 });
 it('rejects changed details and records that cannot be recovered in scope',async()=>{
  await expect(confirmedCreate({data:null,error:{code:'23505'}},async()=>({data:{id:'one',name:'Original'},error:null}),{name:'Changed'})).rejects.toThrow('already saved with different details');
  await expect(confirmedCreate({data:null,error:{code:'23505'}},async()=>({data:null,error:null}),{})).rejects.toEqual({code:'23505'});
 });
});
