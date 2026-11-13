import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({report:vi.fn(),health:vi.fn(),rotateKey:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{id:'admin'}})}));
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
vi.mock('@/lib/services/site-analytics-service',async original=>({...await original<typeof import('@/lib/services/site-analytics-service')>(),siteAnalyticsService:mocks}));
import Analytics from '@/pages/admin/Analytics';
import {analyticsCSV,type SiteAnalyticsReport} from '@/lib/services/site-analytics-service';
const report={generated_at:'2026-11-11T10:00:00Z',since:'2026-11-01T23:00:00Z',days:7,country_filter:null,configured:false,last_event_at:null,metrics:{active_browsers:0,page_views:0,visitors:0,sessions:0,engaged_sessions:0,visible_seconds:0,located_views:0,city_views:0},registrations:{period:2,previous:1,total:10},daily:[],country_options:['NG'],countries:[],locations:[],pages:[],referrers:[],campaigns:[],devices:[],browsers:[],systems:[],languages:[],landing:[],exit:[],journeys:[]} satisfies SiteAnalyticsReport;
function mount(){const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={cache}><MemoryRouter><Analytics/></MemoryRouter></QueryClientProvider>);}
beforeEach(()=>{vi.clearAllMocks();mocks.report.mockResolvedValue(report);mocks.health.mockResolvedValue({configured:false,production:true,geolocation:true});});
afterEach(cleanup);
describe('measured visitor reports',()=>{
 it('shows honest setup and zero-traffic states without sample growth data',async()=>{
  mount();await screen.findByText('No measured visits in this period. Complete setup and deploy before expecting traffic.');expect(screen.getByText(/Vercel collector key is not configured/)).toBeInTheDocument();expect(screen.queryByText('12.5%')).not.toBeInTheDocument();expect(screen.getByRole('heading',{name:'Regions and cities'})).toBeInTheDocument();
 });
 it('applies period and country filters through the report RPC',async()=>{
  mount();await screen.findByRole('heading',{name:'Countries'});fireEvent.change(screen.getByLabelText('Analytics period'),{target:{value:'7'}});await waitFor(()=>expect(mocks.report).toHaveBeenCalledWith(7,null));fireEvent.change(screen.getByLabelText('Visitor country'),{target:{value:'NG'}});await waitFor(()=>expect(mocks.report).toHaveBeenCalledWith(7,'NG'));
 });
 it('does not expose cached/sample metrics after report access fails',async()=>{
  mocks.report.mockRejectedValue(new Error('denied'));mount();expect(await screen.findByRole('alert')).toHaveTextContent('Visitor analytics could not be loaded');expect(screen.queryByText('Distinct browsers')).not.toBeInTheDocument();
 });
 it('rotates the collector key only once while a request is pending',async()=>{
  let finish!:(key:string)=>void;mocks.rotateKey.mockReturnValue(new Promise(resolve=>{finish=resolve;}));mount();await screen.findByRole('heading',{name:'Countries'});fireEvent.click(screen.getByRole('button',{name:'Generate collector key'}));const generate=screen.getByRole('button',{name:'Generate new key'});fireEvent.click(generate);fireEvent.click(generate);expect(mocks.rotateKey).toHaveBeenCalledTimes(1);finish('d'.repeat(64));await screen.findByLabelText('New collector key');
 });
 it('generates actual CSV rows and neutralizes spreadsheet formulas',()=>{
  const csv=analyticsCSV({...report,countries:[{label:'NG',views:12,visitors:4}],campaigns:[{label:'=formula',views:1,visitors:1}]});expect(csv).toContain('"countries","NG","12","4"');expect(csv).toContain("'=formula");
 });
});
