// @vitest-environment-options {"url":"https://1vet.store/","pretendToBeVisual":true}
import {act,cleanup,render} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({user:null as {id:string}|null,role:null as string|null,roles:[] as string[],loading:false,permissionsError:false}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>state}));
import {SiteAnalyticsTracker} from '@/components/shared/SiteAnalyticsTracker';
function view(){return <MemoryRouter initialEntries={['/marketplace/private-product?token=secret']}><SiteAnalyticsTracker/></MemoryRouter>;}
beforeEach(()=>{vi.useFakeTimers();state.user=null;state.role=null;state.roles=[];state.loading=false;state.permissionsError=false;localStorage.clear();sessionStorage.clear();vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true}));});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
describe('visitor tracking auth timing',()=>{
 it('waits for a signed-in role and excludes administrators once resolved',async()=>{
  state.user={id:'administrator'};const screen=render(view());await act(async()=>{vi.advanceTimersByTime(10);});expect(fetch).not.toHaveBeenCalled();expect(localStorage.getItem('1vet-visitor-v1')).toBeNull();
  state.role='admin';state.roles=['admin'];screen.rerender(view());await act(async()=>{vi.advanceTimersByTime(31000);});expect(fetch).not.toHaveBeenCalled();
 });
 it('records guests without private URL identifiers and respects browser opt-out',async()=>{
  render(view());await act(async()=>{vi.advanceTimersByTime(10);});expect(fetch).toHaveBeenCalledOnce();const body=JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string);expect(body.path).toBe('/marketplace/:product');expect(JSON.stringify(body)).not.toContain('private-product');expect(JSON.stringify(body)).not.toContain('secret');
  localStorage.setItem('1vet-analytics-opt-out','true');await act(async()=>{vi.advanceTimersByTime(31000);});expect(fetch).toHaveBeenCalledOnce();
 });
});
