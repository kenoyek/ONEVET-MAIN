import { fireEvent,render,screen,waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach,describe,expect,it,vi } from 'vitest';
const {feed,read,readAll,refresh}=vi.hoisted(()=>({feed:vi.fn(),read:vi.fn(),readAll:vi.fn(),refresh:vi.fn()}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=> <nav>Navigation</nav>}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'owner-id'}})}));
vi.mock('@/hooks/useInAppNotifications',()=>({useNotificationInbox:feed}));
import Notifications from '@/pages/Notifications';
const id='f1111111-1111-4111-8111-111111111111';
describe('Notification inbox',()=>{
 beforeEach(()=>{vi.clearAllMocks();read.mockResolvedValue(undefined);readAll.mockResolvedValue(undefined);feed.mockReturnValue({notifications:[{id:'alert-id',title:'Booking confirmed',message:'Your appointment update',booking_id:id,link:'/my-bookings',created_at:'2026-11-07T09:00:00Z',is_read:false}],hasNext:true,unreadCount:1,countUnavailable:false,loading:false,error:false,mutationError:'',busy:false,markAsRead:read,markAllAsRead:readAll,refetch:refresh});});
 it('opens the affected appointment and acknowledges only the selected alert',()=>{
  render(<MemoryRouter><Notifications/></MemoryRouter>);expect(screen.getByRole('link',{name:'Open details'})).toHaveAttribute('href',`/appointments/${id}`);fireEvent.click(screen.getByRole('button',{name:'Mark as read'}));expect(read).toHaveBeenCalledWith('alert-id');
 });
 it('resets pagination when changing the unread filter',async()=>{
  render(<MemoryRouter><Notifications/></MemoryRouter>);fireEvent.click(screen.getByRole('button',{name:'Next'}));expect(feed).toHaveBeenLastCalledWith(1,false);fireEvent.click(screen.getByRole('checkbox',{name:'Unread only'}));await waitFor(()=>expect(feed).toHaveBeenLastCalledWith(0,true));
 });
 it('shows a load error instead of an empty-success state',()=>{
  feed.mockReturnValue({notifications:[],unreadCount:0,error:true,loading:false,markAllAsRead:readAll,refetch:refresh});render(<MemoryRouter><Notifications/></MemoryRouter>);expect(screen.getByRole('alert')).toHaveTextContent('Could not load');expect(screen.queryByText('No notifications on this page.')).not.toBeInTheDocument();
 });
});
