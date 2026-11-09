import {describe,expect,it,vi} from 'vitest';
import {isRouteLoadError,recoverRouteLoad} from '@/lib/route-recovery';
const failed=()=>new TypeError('Failed to fetch dynamically imported module: /assets/AdminDashboard-old.js');
function storage(){const values=new Map<string,string>();return{getItem:vi.fn((key:string)=>values.get(key)??null),setItem:vi.fn((key:string,value:string)=>{values.set(key,value);})};}
describe('Route download recovery',()=>{
 it.each(['Failed to fetch dynamically imported module: /assets/page.js','Importing a module script failed.','error loading dynamically imported module','Loading chunk 44 failed.','Loading CSS chunk 44 failed.','Unable to preload CSS for /assets/page.css'])('recognizes module failures: %s',message=>{expect(isRouteLoadError(new Error(message))).toBe(true);});
 it('does not reload or hide ordinary programming or data errors',()=>{const store=storage(),reload=vi.fn();expect(recoverRouteLoad(new TypeError('Cannot read properties of null'),store,reload,1000)).toBe(false);expect(reload).not.toHaveBeenCalled();expect(store.getItem).not.toHaveBeenCalled();});
 it('reloads once and persists the guard before navigation',()=>{const store=storage();const reload=vi.fn(()=>expect(store.setItem).toHaveBeenCalledOnce());expect(recoverRouteLoad(failed(),store,reload,1000)).toBe(true);expect(recoverRouteLoad(failed(),store,reload,1100)).toBe(false);expect(reload).toHaveBeenCalledOnce();});
 it('shares the guard across failed routes to prevent a reload chain',()=>{const store=storage(),reload=vi.fn();recoverRouteLoad(failed(),store,reload,1000);expect(recoverRouteLoad(new Error('Unable to preload CSS for another-route.css'),store,reload,1200)).toBe(false);expect(reload).toHaveBeenCalledOnce();});
 it('allows recovery after the cooldown for a later navigation failure',()=>{const store=storage(),reload=vi.fn();recoverRouteLoad(failed(),store,reload,1000);expect(recoverRouteLoad(failed(),store,reload,121001)).toBe(true);expect(reload).toHaveBeenCalledTimes(2);});
 it('keeps manual recovery available if browser storage cannot be used',()=>{const reload=vi.fn();const store={getItem:()=>{throw new Error('Storage unavailable');},setItem:vi.fn()};expect(recoverRouteLoad(failed(),store,reload,1000)).toBe(false);expect(reload).not.toHaveBeenCalled();});
 it('returns to the error UI if the browser refuses navigation',()=>{const store=storage();expect(recoverRouteLoad(failed(),store,()=>{throw new Error('Blocked reload');},1000)).toBe(false);});
});

it('does not navigate away from the error UI while offline',()=>{const status=vi.spyOn(navigator,'onLine','get').mockReturnValue(false);const reload=vi.fn();expect(recoverRouteLoad(failed(),storage(),reload,1000)).toBe(false);expect(reload).not.toHaveBeenCalled();status.mockRestore();});
