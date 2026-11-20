import {act,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({user:'reader-a' as string|null,role:'pet_owner',get:vi.fn(),like:vi.fn(),comment:vi.fn(),remove:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:mock.user?{id:mock.user}:null,role:mock.role})}));
vi.mock('@/lib/services/article-engagement-service',()=>({articleEngagementService:mock}));
import {ArticleDiscussion} from '@/components/articles/ArticleDiscussion';
const comment={id:'comment-a',ordinal:8,author_name:'Ada',body:'Helpful article',mine:true,created_at:'2026-11-20T10:00:00Z'};
const data={likes:3,liked:false,comment_count:1,has_older:false,comments:[comment]};
function mount(moderation = false){const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});return render(<QueryClientProvider client={cache}><MemoryRouter initialEntries={['/articles/animal-care']}><ArticleDiscussion articleId="article-a" moderation={moderation}/></MemoryRouter></QueryClientProvider>);}
describe('Article discussion',()=>{
 beforeEach(()=>{vi.resetAllMocks();mock.user='reader-a';mock.role='pet_owner';mock.get.mockResolvedValue(data);mock.like.mockResolvedValue(undefined);mock.comment.mockResolvedValue(undefined);mock.remove.mockResolvedValue(undefined);});
 it('allows visitors to read while requiring sign-in to participate',async()=>{
  mock.user=null;mount();await screen.findByText('Helpful article');expect(screen.getByRole('button',{name:'3 likes'})).toBeDisabled();expect(screen.getByRole('link',{name:'Sign in to like or leave a comment'})).toHaveAttribute('href','/auth');expect(screen.queryByLabelText('Your comment')).not.toBeInTheDocument();
 });
 it('sets an explicit like state and prevents overlapping actions',async()=>{
  let finish!:()=>void;mock.like.mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=resolve;}));mount();const button=await screen.findByRole('button',{name:'3 likes'});act(()=>{fireEvent.click(button);fireEvent.click(button);});expect(mock.like).toHaveBeenCalledExactlyOnceWith('article-a',true);expect(button).toBeDisabled();mock.get.mockResolvedValue({...data,likes:4,liked:true});await act(async()=>finish());expect(await screen.findByRole('button',{name:'4 likes'})).toHaveAttribute('aria-pressed','true');
 });
 it('retains the draft and retry id after a lost response',async()=>{
  mock.comment.mockRejectedValueOnce(Error('Offline'));mount();fireEvent.change(await screen.findByLabelText('Your comment'),{target:{value:'Thank you for the tips'}});fireEvent.click(screen.getByRole('button',{name:'Post comment'}));await screen.findByRole('alert');expect(screen.getByLabelText('Your comment')).toHaveValue('Thank you for the tips');fireEvent.click(screen.getByRole('button',{name:'Post comment'}));await screen.findByText('Your comment has been posted.');expect(mock.comment).toHaveBeenCalledTimes(2);expect(mock.comment.mock.calls[0]![2]).toBe(mock.comment.mock.calls[1]![2]);expect(screen.getByLabelText('Your comment')).toHaveValue('');
 });
 it('confirms removal and exposes moderation only for owned comments or admins',async()=>{
  mock.get.mockResolvedValue({...data,comments:[{...comment,mine:false}]});const view=mount();await screen.findByText('Helpful article');expect(screen.queryByRole('button',{name:'Remove comment'})).not.toBeInTheDocument();mock.role='admin';view.rerender(<QueryClientProvider client={new QueryClient()}><MemoryRouter><ArticleDiscussion articleId="article-a"/></MemoryRouter></QueryClientProvider>);fireEvent.click(await screen.findByRole('button',{name:'Remove comment'}));expect(mock.remove).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Confirm removal'}));await waitFor(()=>expect(mock.remove).toHaveBeenCalledWith('article-a','comment-a'));
 });
 it('restricts the moderation view to admins',()=>{
  mount(true);
  expect(screen.queryByRole('region',{name:'Comment moderation'})).not.toBeInTheDocument();
  expect(mock.get).not.toHaveBeenCalled();
 });
 it('lets admins confirm and remove another reader’s comment from the moderation view',async()=>{
  mock.role='admin';
  mock.get.mockResolvedValue({...data,comments:[{...comment,mine:false}]});
  mount(true);
  await screen.findByText('Helpful article');
  expect(screen.queryByLabelText('Your comment')).not.toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'3 likes'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Remove comment'}));
  fireEvent.click(screen.getByRole('button',{name:'Keep comment'}));
  expect(mock.remove).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Remove comment'}));
  mock.get.mockResolvedValue({...data,comment_count:0,comments:[]});
  fireEvent.click(screen.getByRole('button',{name:'Confirm removal'}));
  await screen.findByText('No comments on this page.');
  expect(mock.remove).toHaveBeenCalledExactlyOnceWith('article-a','comment-a');
  expect(screen.getByText('0 comments')).toBeInTheDocument();
 });
 it('keeps saved comments successful when refresh fails',async()=>{
  mount();fireEvent.change(await screen.findByLabelText('Your comment'),{target:{value:'Great read'}});mock.get.mockRejectedValue(Error('Reload failed'));fireEvent.click(screen.getByRole('button',{name:'Post comment'}));expect(await screen.findByText('Your comment has been posted. Refresh the discussion to update the counts.')).toBeInTheDocument();expect(mock.comment).toHaveBeenCalledOnce();
 });
 it('renders user content as text and allows paging back without losing the draft',async()=>{
  mock.get.mockImplementation((_id:string,before?:number)=>Promise.resolve({...data,has_older:before===undefined,comments:[{...comment,body:before===undefined?'<img src=x onerror=alert(1)>':'Older comment'}]}));mount();await screen.findByText('<img src=x onerror=alert(1)>');expect(document.querySelector('img')).toBeNull();fireEvent.change(screen.getByLabelText('Your comment'),{target:{value:'Draft'}});fireEvent.click(screen.getByRole('button',{name:'View older comments'}));await screen.findByText('Older comment');fireEvent.click(screen.getByRole('button',{name:'View newer comments'}));await screen.findByText('<img src=x onerror=alert(1)>');expect(screen.getByLabelText('Your comment')).toHaveValue('Draft');
 });
 it('does not retain one account’s draft after switching accounts',async()=>{
  const view=mount();fireEvent.change(await screen.findByLabelText('Your comment'),{target:{value:'Private draft'}});mock.user='reader-b';view.rerender(<QueryClientProvider client={new QueryClient()}><MemoryRouter><ArticleDiscussion articleId="article-a"/></MemoryRouter></QueryClientProvider>);expect(await screen.findByLabelText('Your comment')).toHaveValue('');
 });
 it('shows a failed lookup without inventing zero counts',async()=>{
  mock.get.mockRejectedValue(Error('Unavailable'));mount();expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable');expect(screen.queryByRole('button',{name:'0 likes'})).not.toBeInTheDocument();mock.get.mockResolvedValue(data);fireEvent.click(screen.getByRole('button',{name:'Retry discussion'}));await screen.findByText('Helpful article');
 });
});
