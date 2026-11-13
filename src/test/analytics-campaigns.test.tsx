import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {CampaignLinkBuilder} from '@/components/admin/CampaignLinkBuilder';
import {analyticsFilters,analyticsReportLink,campaignLink} from '@/lib/analytics-navigation';
const clipboard=Object.getOwnPropertyDescriptor(navigator,'clipboard');
afterEach(()=>{cleanup();if(clipboard)Object.defineProperty(navigator,'clipboard',clipboard);else Reflect.deleteProperty(navigator,'clipboard');});
describe('analytics acquisition tools',()=>{
 it('creates canonical tagged links and keeps the signup mode intact',()=>{
  const url=new URL(campaignLink('/auth?mode=signup',' Facebook ','Social','November Launch'));expect(url.origin).toBe('https://1vet.store');expect(url.searchParams.get('mode')).toBe('signup');expect(url.searchParams.get('utm_source')).toBe('facebook');expect(url.searchParams.get('utm_campaign')).toBe('november_launch');
 });
 it('rejects unlisted destinations and labels outside the tracker format',()=>{
  expect(()=>campaignLink('https://example.invalid','source','social','launch')).toThrow('listed 1Vet');expect(()=>campaignLink('/marketplace','person@example.com','social','launch')).toThrow('Complete all labels');expect(()=>campaignLink('/marketplace','','social','launch')).toThrow();
 });
 it('restores valid report filters and bounds invalid shared values',()=>{
  expect(analyticsFilters(new URLSearchParams('days=7&country=NG'))).toEqual({days:7,country:'NG'});expect(analyticsFilters(new URLSearchParams('days=999&country=private'))).toEqual({days:30,country:''});expect(analyticsReportLink(7,'NG')).toBe('https://1vet.store/admin/analytics?days=7&country=NG');
 });
 it('generates and copies a link, then removes the stale output when labels change',async()=>{
  const writeText=vi.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText}});render(<CampaignLinkBuilder/>);
  for(const [label,value] of [['Source','facebook'],['Medium','social'],['Campaign','November launch']] as const)fireEvent.change(screen.getByLabelText(label),{target:{value}});
  fireEvent.click(screen.getByRole('button',{name:'Build campaign link'}));expect(screen.getByLabelText('Generated campaign link')).toHaveValue(campaignLink('/marketplace','facebook','social','November launch'));fireEvent.click(screen.getByRole('button',{name:'Copy campaign link'}));await waitFor(()=>expect(writeText).toHaveBeenCalledOnce());
  fireEvent.change(screen.getByLabelText('Campaign'),{target:{value:'next_campaign'}});expect(screen.queryByLabelText('Generated campaign link')).not.toBeInTheDocument();
 });
});
