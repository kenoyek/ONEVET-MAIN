import type {IncomingMessage,ServerResponse} from 'node:http';
import {createHmac} from 'node:crypto';
import {agentBreakdown,campaignTag,referrerHost,validVisit} from '../src/lib/site-analytics.js';
type Request=IncomingMessage&{body?:unknown};
const origins=['https://1vet.store','https://www.1vet.store'];
function header(req:Request,name:string){const value=req.headers[name];return Array.isArray(value)?value[0]||'':value||'';}
function geo(value:string){try{return decodeURIComponent(value).replace(/[\r\n\t]/g,' ').trim().slice(0,120)||null;}catch{return null;}}
async function collectorRPC(name:string,body:unknown){
 const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||'https://fxvctkfhitpgfyaztqor.supabase.co';
 const key=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_ANON_KEY||'sb_publishable_faCoot0rMDedxYC163rpFQ_lRRJesg5';
 return fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(5000)});
}
export default async function handler(req:Request,res:ServerResponse){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 const configured=!!process.env.SITE_ANALYTICS_KEY;
 if(req.method==='GET'){
  let verified=false;
  if(configured&&process.env.VERCEL_ENV==='production'&&process.env.VERCEL==='1'){try{const result=await collectorRPC('site_analytics_collector_ready',{ingest_key:process.env.SITE_ANALYTICS_KEY});verified=result.ok&&(await result.json())===true;}catch{/* Configuration errors are reported without leaking keys. */}}
  res.statusCode=200;res.end(JSON.stringify({configured,verified,production:process.env.VERCEL_ENV==='production',geolocation:process.env.VERCEL==='1'}));return;
 }
 if(req.method!=='POST'){res.statusCode=405;res.end('{}');return;}
 if(!configured||process.env.VERCEL_ENV!=='production'||process.env.VERCEL!=='1'){res.statusCode=503;res.end('{}');return;}
 if(Number(header(req,'content-length'))>3000){res.statusCode=413;res.end('{}');return;}
 if(!origins.includes(header(req,'origin'))){res.statusCode=403;res.end('{}');return;}
 if(header(req,'dnt')==='1'||header(req,'sec-gpc')==='1'){res.statusCode=204;res.end();return;}
 const agent=agentBreakdown(header(req,'user-agent'));
 if(agent.bot){res.statusCode=204;res.end();return;}
 let body:unknown=req.body;
 try{if(typeof body==='string')body=JSON.parse(body);}catch{body=null;}
 if(!validVisit(body)||JSON.stringify(body).length>3000){res.statusCode=400;res.end('{}');return;}
 const country=header(req,'x-vercel-ip-country').toUpperCase();const located=/^[A-Z]{2}$/.test(country)&&!['XX','ZZ'].includes(country);
 const clientAddress=header(req,'x-vercel-forwarded-for')||header(req,'x-forwarded-for').split(',')[0]?.trim()||body.visitor_id;
 const abuse=createHmac('sha256',process.env.SITE_ANALYTICS_KEY!).update(new Date().toISOString().slice(0,10)+':'+clientAddress).digest('hex');
 const payload={id:body.id,visitor_id:body.visitor_id,session_id:body.session_id,event_name:body.event_name,path:body.path,
  country:located?country:null,region:located?geo(header(req,'x-vercel-ip-country-region')):null,city:located?geo(header(req,'x-vercel-ip-city')):null,
  device:agent.device,browser:agent.browser,os:agent.os,abuse_key:abuse,
  referrer:typeof body.referrer==='string'?referrerHost('https://'+body.referrer):null,
  source:campaignTag(body.source),medium:campaignTag(body.medium),campaign:campaignTag(body.campaign),language:typeof body.language==='string'&&/^[a-zA-Z-]{2,20}$/.test(body.language)?body.language:null};
 try{
  const result=await collectorRPC('record_site_visit',{payload,ingest_key:process.env.SITE_ANALYTICS_KEY});
  res.statusCode=result.ok?204:503;res.end(result.ok?undefined:'{}');
 }catch{res.statusCode=503;res.end('{}');}
}
