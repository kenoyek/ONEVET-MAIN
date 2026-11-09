const recoveryKey='onevet:route-recovery-at';
const recoveryWindowMs=120_000;

/** Only module-download failures qualify; ordinary application errors stay visible. */
export function isRouteLoadError(error:unknown):boolean{
 const message=error instanceof Error?error.message:typeof error==='string'?error:'';
 return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading (?:CSS )?chunk [\w-]+ failed|Unable to preload CSS/i.test(message);
}

export function recoverRouteLoad(error:unknown,storage?:Pick<Storage,'getItem'|'setItem'>,reload:()=>void=()=>window.location.reload(),now=Date.now()):boolean{
 if(!isRouteLoadError(error))return false;
 if(typeof navigator!=='undefined'&&navigator.onLine===false)return false;
 try{
  const store=storage??window.sessionStorage;
  const previous=store.getItem(recoveryKey);
  const attemptedAt=previous===null?NaN:Number(previous);
  if(Number.isFinite(attemptedAt)&&now-attemptedAt>=0&&now-attemptedAt<recoveryWindowMs)return false;
  // Write before navigating so a persistent failure cannot create a reload loop.
  store.setItem(recoveryKey,String(now));
  reload();
  return true;
 }catch{
  // If storage or navigation is unavailable, keep a usable manual retry screen.
  return false;
 }
}
