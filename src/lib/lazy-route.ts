import {lazy,type ComponentType} from 'react';
import {recoverRouteLoad} from '@/lib/route-recovery';

type RouteModule={default:ComponentType};

export async function loadRoute(importer:()=>Promise<RouteModule>):Promise<RouteModule>{
 try{return await importer();}
 catch(error){
  if(recoverRouteLoad(error)){
   // Keep Suspense visible while the browser loads the current deployment.
   // Returning undefined would cause a second React.lazy error before navigation.
   return await new Promise<RouteModule>(()=>{});
  }
  throw error;
 }
}

export function lazyRoute(importer:()=>Promise<RouteModule>){return lazy(()=>loadRoute(importer));}
