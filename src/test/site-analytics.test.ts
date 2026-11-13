import {describe,expect,it} from 'vitest';
import {analyticsPath,agentBreakdown,campaignTag,referrerHost,validVisit} from '@/lib/site-analytics';
import {analyticsIdentity} from '@/lib/site-analytics-identity';
function store(){const values=new Map<string,string>();return{getItem:(key:string)=>values.get(key)||null,setItem:(key:string,value:string)=>{values.set(key,value);}};}
describe('first-party analytics measurements',()=>{
 it('removes identifiers and excludes admin/callback pages',()=>{
  expect(analyticsPath('/pets/private-animal')).toBe('/pets/:pet');expect(analyticsPath('/marketplace/product-id')).toBe('/marketplace/:product');expect(analyticsPath('/admin/users')).toBeNull();expect(analyticsPath('/auth/callback')).toBeNull();
 });
 it('retains referring domains only and bounds campaign tags',()=>{
  expect(referrerHost('https://www.google.com/search?q=private#token')).toBe('google.com');expect(referrerHost('javascript:alert(1)')).toBeNull();expect(campaignTag('launch campaign')).toBe('launch campaign');expect(campaignTag('person@example.com')).toBeNull();expect(campaignTag({value:'unsafe'})).toBeNull();
 });
 it('classifies browser/device categories and obvious bots without storing full agents',()=>{
  expect(agentBreakdown('Mozilla/5.0 (iPhone) AppleWebKit/605.1 Mobile Safari/604.1')).toMatchObject({device:'mobile',os:'iOS',browser:'Safari',bot:false});expect(agentBreakdown('Googlebot/2.1').bot).toBe(true);expect(agentBreakdown('HeadlessChrome/123').bot).toBe(true);
 });
 it('keeps a browser identity and first-session attribution across navigation, then expires sessions',()=>{
  const local=store(),session=store();const initial=analyticsIdentity(local,session,1000,new URLSearchParams('utm_source=google&utm_campaign=launch'),'https://google.com/?secret=x');
  const next=analyticsIdentity(local,session,2000,new URLSearchParams(),'https://1vet.store/cart');expect(next.visitor_id).toBe(initial.visitor_id);expect(next.session_id).toBe(initial.session_id);expect(next.source).toBe('google');expect(next.referrer).toBe('google.com');
  const expired=analyticsIdentity(local,session,2000+31*60000,new URLSearchParams(),'https://1vet.store/');expect(expired.visitor_id).toBe(initial.visitor_id);expect(expired.session_id).not.toBe(initial.session_id);expect(expired.referrer).toBeNull();expect(expired.newSession).toBe(true);
 });
 it('expires browser identities after ninety days and rejects invalid event cores',()=>{
  const local=store(),session=store();const initial=analyticsIdentity(local,session,1000,new URLSearchParams(),'');const later=analyticsIdentity(local,session,1000+91*86400000,new URLSearchParams(),'');expect(initial.visitor_id).not.toBe(later.visitor_id);
  expect(validVisit({id:'bad',visitor_id:'bad',session_id:'bad',path:'/pets/secret',event_name:'page_view'})).toBe(false);
 });
});
