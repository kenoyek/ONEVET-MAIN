import {campaignTag} from './site-analytics';
export const campaignDestinations=[['/','Homepage'],['/marketplace','Marketplace'],['/find-a-vet','Find a veterinarian'],['/provider-marketplace','Care directory'],['/articles','Articles'],['/pet-care','Pet care'],['/farm-care','Farm care'],['/auth?mode=signup','Create an account']] as const;
export function campaignLink(destination:string,source:string,medium:string,campaign:string){
 if(!campaignDestinations.some(([path])=>path===destination))throw new Error('Choose a listed 1Vet destination.');
 const tags=[source,medium,campaign].map(value=>campaignTag(value.trim()));
 if(tags.some(value=>!value))throw new Error('Complete all labels using up to 64 letters, numbers, spaces, dots, hyphens or underscores.');
 const url=new URL(destination,'https://1vet.store');
 ['utm_source','utm_medium','utm_campaign'].forEach((key,index)=>url.searchParams.set(key,tags[index]!.toLowerCase().replace(/\s+/g,'_')));
 return url.toString();
}
export function analyticsFilters(params:URLSearchParams){
 const days=Number(params.get('days')||30);const country=params.get('country')||'';
 return {days:[1,7,30,90].includes(days)?days:30,country:/^[A-Z]{2}$/.test(country)?country:''};
}
export function analyticsReportLink(days:number,country:string){
 const filters=analyticsFilters(new URLSearchParams({days:String(days),country}));const url=new URL('/admin/analytics','https://1vet.store');if(filters.days!==30)url.searchParams.set('days',String(filters.days));if(filters.country)url.searchParams.set('country',filters.country);return url.toString();
}
