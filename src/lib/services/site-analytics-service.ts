import {supabase} from '@/integrations/supabase/client';
export type AnalyticsRow={label:string;views:number;visitors:number};
export type SiteAnalyticsReport={generated_at:string;since:string;days:number;country_filter:string|null;configured:boolean;last_event_at:string|null;metrics:{active_browsers:number;page_views:number;visitors:number;sessions:number;engaged_sessions:number;visible_seconds:number;located_views:number;city_views:number};registrations:{period:number;previous:number;total:number};daily:{day:string;page_views:number;visitors:number}[];country_options:string[];countries:AnalyticsRow[];locations:AnalyticsRow[];pages:AnalyticsRow[];referrers:AnalyticsRow[];campaigns:AnalyticsRow[];devices:AnalyticsRow[];browsers:AnalyticsRow[];systems:AnalyticsRow[];languages:AnalyticsRow[];landing:AnalyticsRow[];exit:AnalyticsRow[];journeys:AnalyticsRow[]};
export const siteAnalyticsService={
 async report(days:number,country:string|null){const {data,error}=await supabase.rpc('site_analytics_report',{window_days:days,country_filter:country});if(error)throw error;if(!data||typeof data!=='object'||Array.isArray(data)||!('metrics'in data))throw new Error('Invalid analytics report');return data as unknown as SiteAnalyticsReport;},
 async rotateKey(){const {data,error}=await supabase.rpc('rotate_site_analytics_key');if(error)throw error;return data;},
 async health(){const response=await fetch('/api/visit',{cache:'no-store'});if(!response.ok)throw new Error('Collector unavailable');return response.json() as Promise<{configured:boolean;verified:boolean;production:boolean;geolocation:boolean}>;},
};
export function analyticsCSV(report:SiteAnalyticsReport){
 const cell=(value:unknown)=>{let text=String(value??'');if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 const rows:unknown[][]=[['1Vet measured visitor analytics'],['From',report.since],['Generated',report.generated_at],['Country filter',report.country_filter||'All'],['Section','Label','Page views / entries','Distinct browsers']];
 rows.push(['Summary metric','Value']);for(const [label,value] of Object.entries(report.metrics))rows.push([label,value]);rows.push(['Account registrations (all countries)',report.registrations.period],['Previous-period registrations',report.registrations.previous],['Total accounts',report.registrations.total],['Daily traffic','Day','Page views','Distinct browsers']);for(const day of report.daily)rows.push(['daily',day.day,day.page_views,day.visitors]);rows.push(['Section','Label','Page views / entries','Distinct browsers']);
 for(const section of ['countries','locations','pages','referrers','campaigns','devices','browsers','systems','languages','landing','exit','journeys'] as const)for(const row of report[section])rows.push([section,row.label,row.views,row.visitors]);
 return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
}
