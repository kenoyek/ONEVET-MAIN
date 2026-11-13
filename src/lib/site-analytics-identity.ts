import {campaignTag,referrerHost,UUID_PATTERN} from './site-analytics';
type Store=Pick<Storage,'getItem'|'setItem'>;
export function analyticsIdentity(local:Store,session:Store,now:number,params:URLSearchParams,referrer:string){
 const previousVisitor=JSON.parse(local.getItem('1vet-visitor-v1')||'null') as {id:string;expires:number}|null;
 const validVisitor=previousVisitor&&UUID_PATTERN.test(previousVisitor.id)&&previousVisitor.expires>now;
 const visitor=validVisitor?previousVisitor.id:crypto.randomUUID();
 local.setItem('1vet-visitor-v1',JSON.stringify({id:visitor,expires:validVisitor?previousVisitor.expires:now+90*86400000}));
 const previous=JSON.parse(session.getItem('1vet-session-v1')||'null') as {id:string;last:number;source:string|null;medium:string|null;campaign:string|null;referrer:string|null}|null;
 const same=previous&&UUID_PATTERN.test(previous.id)&&now>=previous.last&&now-previous.last<30*60000;
 const host=referrerHost(referrer);
 const value={id:same?previous.id:crypto.randomUUID(),last:now,source:same?previous.source:campaignTag(params.get('utm_source')),medium:same?previous.medium:campaignTag(params.get('utm_medium')),campaign:same?previous.campaign:campaignTag(params.get('utm_campaign')),referrer:same?previous.referrer:host==='1vet.store'?null:host};
 session.setItem('1vet-session-v1',JSON.stringify(value));
 return {visitor_id:visitor,session_id:value.id,source:value.source,medium:value.medium,campaign:value.campaign,referrer:value.referrer,newSession:!same};
}
