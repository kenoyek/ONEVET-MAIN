import { act,render,screen,waitFor } from '@testing-library/react';
import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
import { beforeEach,describe,expect,it,vi } from 'vitest';
const state=vi.hoisted(()=>({userId:'account-a',list:vi.fn(),unread:vi.fn(),markRead:vi.fn(),callbacks:[] as Array<()=>void>,remove:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:state.userId?{id:state.userId}:null})}));
vi.mock('@/lib/services/inbox-service',()=>({inboxService:{list:state.list,unread:state.unread,markRead:state.markRead}}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{channel:()=>{const channel={on:(_event:string,_filter:unknown,fn:()=>void)=>{state.callbacks.push(fn);return channel;},subscribe:()=>channel};return channel;},removeChannel:state.remove}}));
import {useInAppNotifications} from '@/hooks/useInAppNotifications';
function Probe(){const inbox=useInAppNotifications();return <><p data-testid="inbox">{inbox.notifications.map(row=>row.title).join('|')} · {inbox.unreadCount}</p><p data-testid="action">{inbox.mutationError}</p><button onClick={()=>void inbox.markAsRead('alert-id').catch(()=>{})}>Read</button></>;}
function setup(){const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});const wrapper=({children}:{children:React.ReactNode})=><QueryClientProvider client={cache}>{children}</QueryClientProvider>;return render(<Probe/>,{wrapper});}
describe('Notification account isolation',()=>{
 beforeEach(()=>{vi.clearAllMocks();state.userId='account-a';state.callbacks=[];state.list.mockImplementation((id:string)=>Promise.resolve({rows:[{id:'alert-id',title:id+' alert'}],hasNext:false}));state.unread.mockResolvedValue(1);state.markRead.mockResolvedValue(undefined);});
 it('ignores an old account response after switching accounts',async()=>{
  let release!:(value:unknown)=>void;state.list.mockImplementation((id:string)=>id==='account-a'?new Promise(resolve=>{release=resolve;}):Promise.resolve({rows:[{id:'new-id',title:'account-b alert'}],hasNext:false}));const view=setup();await waitFor(()=>expect(state.list).toHaveBeenCalledWith('account-a',0,10,false));state.userId='account-b';view.rerender(<Probe/>);expect(screen.getByTestId('inbox')).not.toHaveTextContent('account-a alert');await screen.findByText('account-b alert · 1');await act(async()=>{release({rows:[{id:'old-id',title:'PRIVATE ACCOUNT A'}],hasNext:false});});expect(screen.getByTestId('inbox')).not.toHaveTextContent('PRIVATE ACCOUNT A');
 });
 it('clears visible alerts and ignores queued callbacks after logout',async()=>{
  const view=setup();await screen.findByText('account-a alert · 1');const callback=state.callbacks[0]!;state.userId='';view.rerender(<Probe/>);expect(screen.getByTestId('inbox')).toHaveTextContent('· 0');expect(screen.getByTestId('inbox')).not.toHaveTextContent('account-a alert');const calls=state.list.mock.calls.length;act(()=>callback());expect(state.list).toHaveBeenCalledTimes(calls);expect(state.remove).toHaveBeenCalled();
 });
 it('does not decrement counts optimistically when marking read fails',async()=>{
  state.markRead.mockRejectedValue(new Error('Offline'));setup();await screen.findByText('account-a alert · 1');screen.getByRole('button',{name:'Read'}).click();await waitFor(()=>expect(screen.getByTestId('action')).toHaveTextContent('Could not mark'));expect(screen.getByTestId('inbox')).toHaveTextContent('· 1');
 });
});
