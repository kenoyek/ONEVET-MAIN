import {useEffect,useRef} from 'react';
import {useLocation} from 'react-router-dom';
import {useAuth} from '@/lib/auth-context';
import {analyticsPath} from '@/lib/site-analytics';
import {analyticsIdentity} from '@/lib/site-analytics-identity';
export function SiteAnalyticsTracker(){
 const location=useLocation();const {user,role,roles=[],loading,permissionsError}=useAuth();const recent=useRef('');const userId=user?.id;
 useEffect(()=>{
  if(role==='admin'||roles.includes('admin')){recent.current='';return;}
  if(import.meta.env.VITE_ENABLE_ANALYTICS==='false'||loading||(!!userId&&!role)||permissionsError||!['1vet.store','www.1vet.store'].includes(window.location.hostname)||navigator.doNotTrack==='1'||(navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl)return;
  const path=analyticsPath(location.pathname);if(!path){recent.current='';return;}
  const pageKey=location.pathname;
  let stopped=false;
  function send(event:'page_view'|'heartbeat'){
   if(stopped||document.visibilityState!=='visible')return;
   try{
    if(localStorage.getItem('1vet-analytics-opt-out')==='true')return;
    const identity=analyticsIdentity(localStorage,sessionStorage,Date.now(),new URLSearchParams(location.search),document.referrer);
    const event_name=identity.newSession?'page_view':event;
    const payload={id:crypto.randomUUID(),visitor_id:identity.visitor_id,session_id:identity.session_id,event_name,path,referrer:identity.referrer,source:identity.source,medium:identity.medium,campaign:identity.campaign,language:navigator.language};
    if(event_name==='page_view')recent.current=pageKey;
    void fetch('/api/visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
   }catch{/* Storage/privacy restrictions exclude this browser from measurement. */}
  }
  const start=window.setTimeout(()=>{if(recent.current!==pageKey)send('page_view');},0);
  const beat=window.setInterval(()=>send('heartbeat'),30000);
  const visible=()=>{if(recent.current!==pageKey)send('page_view');};
  document.addEventListener('visibilitychange',visible);
  return()=>{stopped=true;clearTimeout(start);clearInterval(beat);document.removeEventListener('visibilitychange',visible);};
 },[location.pathname,loading,role,roles,userId,permissionsError,location.search]);
 return null;
}
