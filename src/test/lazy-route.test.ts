import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({recover:vi.fn()}));
vi.mock('@/lib/route-recovery',()=>({recoverRouteLoad:mock.recover}));
import {loadRoute} from '@/lib/lazy-route';
beforeEach(()=>{vi.clearAllMocks();});
describe('Lazy route loading',()=>{
 it('returns successfully downloaded pages unchanged',async()=>{const page={default:()=>null};expect(await loadRoute(async()=>page)).toBe(page);expect(mock.recover).not.toHaveBeenCalled();});
 it('keeps Suspense pending instead of returning an invalid module during reload',async()=>{mock.recover.mockReturnValue(true);let settled=false;void loadRoute(async()=>{throw new Error('Failed module');}).then(()=>{settled=true;},()=>{settled=true;});await Promise.resolve();await Promise.resolve();expect(mock.recover).toHaveBeenCalledOnce();expect(settled).toBe(false);});
 it('passes persistent or non-module errors to the error boundary',async()=>{mock.recover.mockReturnValue(false);const error=new Error('Persistent failure');await expect(loadRoute(async()=>{throw error;})).rejects.toBe(error);});
});
