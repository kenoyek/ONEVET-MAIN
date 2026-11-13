export const ANALYTICS_PATHS=['/','/about','/pricing','/contact','/articles','/articles/:article','/services','/pet-care','/farm-care','/urgent-care','/find-a-vet','/provider-marketplace','/provider/public/:provider','/marketplace','/marketplace/:product','/cart','/checkout','/auth','/dashboard','/vet-dashboard','/profile','/pets','/pets/new','/pets/:pet','/farms','/farms/:farm','/booking/new','/my-bookings','/appointments/:appointment','/provider/register','/provider/organization/:organization','/other'];
export function analyticsPath(path:string):string|null {
  if(path.startsWith('/admin')||path.startsWith('/auth/callback')||path==='/privacy')return null;
  if(ANALYTICS_PATHS.includes(path))return path;
  for(const [pattern,route] of [[/^\/articles\/[^/]+$/,'/articles/:article'],[/^\/marketplace\/[^/]+$/,'/marketplace/:product'],[/^\/pets\/[^/]+$/,'/pets/:pet'],[/^\/farms\/[^/]+$/,'/farms/:farm'],[/^\/appointments\/[^/]+$/,'/appointments/:appointment'],[/^\/provider\/public\/[^/]+$/,'/provider/public/:provider'],[/^\/provider\/organization\/[^/]+$/,'/provider/organization/:organization']] as const)if(pattern.test(path))return route;
  return '/other';
}
export function campaignTag(value:unknown){return typeof value==='string'&&/^[a-zA-Z0-9 _.-]{1,64}$/.test(value)?value.trim()||null:null;}
export function referrerHost(value:string){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.hostname.replace(/^www\./,'').slice(0,150):null;}catch{return null;}}
export function agentBreakdown(agent:string){
  const bot=/bot\b|crawler|spider|headless|lighthouse|preview|facebookexternalhit|slurp|bingpreview/i.test(agent);
  const device=/ipad|tablet|android(?!.*mobile)/i.test(agent)?'tablet':/mobile|iphone|ipod/i.test(agent)?'mobile':agent?'desktop':'unknown';
  const browser=/edg\//i.test(agent)?'Edge':/firefox\//i.test(agent)?'Firefox':/chrome\/|crios\//i.test(agent)?'Chrome':/safari\//i.test(agent)?'Safari':'Other';
  const os=/android/i.test(agent)?'Android':/iphone|ipad|ipod/i.test(agent)?'iOS':/windows/i.test(agent)?'Windows':/macintosh|mac os/i.test(agent)?'macOS':/linux/i.test(agent)?'Linux':'Other';
  return {bot,device,browser,os};
}
export const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type VisitPayload={id:string;visitor_id:string;session_id:string;event_name:'page_view'|'heartbeat';path:string;referrer:string|null;source:string|null;medium:string|null;campaign:string|null;language:string|null};
export function validVisit(value:unknown):value is VisitPayload {
  if(!value||typeof value!=='object')return false;const v=value as Record<string,unknown>;
  return ['id','visitor_id','session_id'].every(key=>typeof v[key]==='string'&&UUID_PATTERN.test(v[key] as string))&&typeof v.event_name==='string'&&['page_view','heartbeat'].includes(v.event_name)&&typeof v.path==='string'&&ANALYTICS_PATHS.includes(v.path);
}
