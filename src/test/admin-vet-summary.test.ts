import {beforeEach,expect,it,vi} from 'vitest';
const fixture=vi.hoisted(()=>({roles:[] as {user_id:string;role:string}[],profiles:[] as Record<string,unknown>[],ranges:[] as number[][],missingCount:false,profileQueries:0}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:(table:string)=>{
 const filters:Array<(row:Record<string,unknown>)=>boolean>=[];let head=false;let range=[0,Infinity];
 const result=()=>{const source=table==='user_roles'?fixture.roles:fixture.profiles;const rows=source.filter(row=>filters.every(test=>test(row)));return {data:head?null:rows.slice(range[0],range[1]!+1),count:fixture.missingCount?null:rows.length,error:null};};
 const query={select:(_columns:string,options?:{head?:boolean})=>{head=!!options?.head;return query;},eq:(key:string,value:unknown)=>{filters.push(row=>row[key]===value);return query;},in:(key:string,values:unknown[])=>{filters.push(row=>values.includes(row[key]));return query;},order:()=>query,range:(start:number,end:number)=>{fixture.ranges.push([start,end]);range=[start,end];return Promise.resolve(result());},then:(resolve:(value:unknown)=>unknown,reject:(error:unknown)=>unknown)=>Promise.resolve(result()).then(resolve,reject)};
 if(table==='profiles')fixture.profileQueries++;
 return query;
}}}));
import {adminVetSummaryService} from '@/lib/services/admin-vet-summary-service';
function uid(value:number){return 'f0000000-0000-4000-8000-'+String(value).padStart(12,'0');}
function profile(id:string,extra:Record<string,unknown>={}){return {id,user_id:id,first_name:'Test',last_name:'Applicant',email:null,license_number:null,license_url:null,created_at:'2026-11-18T00:00:00Z',vendor_type:null,is_active:true,verification_status:'pending',license_verified:false,...extra};}
beforeEach(()=>{fixture.roles=[];fixture.profiles=[];fixture.ranges=[];fixture.missingCount=false;fixture.profileQueries=0;});
it('counts zero onboarded vets when the only veterinarian role belongs to an unapproved account',async()=>{
 fixture.roles=[{user_id:'admin-draft',role:'veterinarian'},{user_id:'admin-draft',role:'admin'}];fixture.profiles=[profile('admin-draft')];
 const result=await adminVetSummaryService.load();expect(result.approvedCount).toBe(0);expect(result.pendingVets).toHaveLength(0);
});
it('matches clinical eligibility and excludes inactive, unverified, rejected and non-vet accounts',async()=>{
 const ids=['approved','inactive','unverified','rejected'];fixture.roles=ids.map(user_id=>({user_id,role:'veterinarian'}));
 const approved={verification_status:'approved',license_verified:true};fixture.profiles=[profile('approved',approved),profile('inactive',{...approved,is_active:false}),profile('unverified',{...approved,license_verified:false}),profile('rejected',{...approved,verification_status:'rejected'}),profile('client',approved)];
 expect((await adminVetSummaryService.load()).approvedCount).toBe(1);
});
it('checks later role pages instead of truncating the onboarding count',async()=>{
 fixture.roles=Array.from({length:101},(_,i)=>({user_id:uid(i),role:'veterinarian'}));fixture.profiles=fixture.roles.map((row,i)=>profile(row.user_id,{license_number:'VCN-test',license_url:row.user_id+'/license.pdf',...(i===100?{verification_status:'approved',license_verified:true}:{})}));
 const result=await adminVetSummaryService.load();expect(result.approvedCount).toBe(1);expect(result.pendingVets).toHaveLength(100);expect(fixture.ranges).toEqual([[0,99],[100,199]]);
});
it('returns zero without profile queries when no veterinarian accounts exist',async()=>{
 expect(await adminVetSummaryService.load()).toEqual({approvedCount:0,pendingVets:[],incompleteVets:[]});expect(fixture.profileQueries).toBe(0);
});
it('fails visibly when exact count metadata is unavailable instead of fabricating zero',async()=>{
 fixture.missingCount=true;await expect(adminVetSummaryService.load()).rejects.toThrow('could not be checked');
});

it('shows only complete, applicant-owned pending licence submissions for review',async()=>{
 const ready=uid(201),draft=uid(202),foreign=uid(203);fixture.roles=[ready,draft,foreign].map(user_id=>({user_id,role:'veterinarian'}));fixture.profiles=[profile(ready,{license_number:'VCN-123',license_url:ready+'/license.pdf'}),profile(draft),profile(foreign,{license_number:'VCN-456',license_url:uid(204)+'/license.pdf'})];
 const result=await adminVetSummaryService.load();expect(result.approvedCount).toBe(0);expect(result.pendingVets.map(p=>p.user_id)).toEqual([ready]);
});

it('keeps incomplete registrations separate and explains exactly what is missing',async()=>{
 const noNumber=uid(301), noDocument=uid(302), foreign=uid(303), draft=uid(304);
 fixture.roles=[noNumber,noDocument,foreign,draft].map(user_id=>({user_id,role:'veterinarian'}));
 fixture.profiles=[profile(noNumber,{license_number:'  ',license_url:noNumber+'/licence.pdf'}),profile(noDocument,{license_number:'VCN-1'}),profile(foreign,{license_number:'VCN-2',license_url:uid(999)+'/licence.pdf'}),profile(draft)];
 const result=await adminVetSummaryService.load();
 expect(result.approvedCount).toBe(0); expect(result.pendingVets).toEqual([]);
 expect(result.incompleteVets.map(vet=>[vet.user_id,vet.missingRequirements])).toEqual([
  [noNumber,['Licence number']], [noDocument,['Valid applicant-owned licence document']],
  [foreign,['Valid applicant-owned licence document']], [draft,['Licence number','Valid applicant-owned licence document']],
 ]);
});
it('moves a completed registration into review without treating it as onboarded',async()=>{
 const id=uid(401);fixture.roles=[{user_id:id,role:'veterinarian'}];fixture.profiles=[profile(id)];
 expect((await adminVetSummaryService.load()).incompleteVets).toHaveLength(1);
 fixture.profiles=[profile(id,{license_number:'VCN-401',license_url:id+'/licence.pdf'})];
 const submitted=await adminVetSummaryService.load();expect(submitted.incompleteVets).toEqual([]);expect(submitted.pendingVets).toHaveLength(1);expect(submitted.approvedCount).toBe(0);
 fixture.profiles=[profile(id,{verification_status:'approved',license_verified:true})];
 const approved=await adminVetSummaryService.load();expect(approved.approvedCount).toBe(1);expect(approved.pendingVets).toEqual([]);expect(approved.incompleteVets).toEqual([]);
});
