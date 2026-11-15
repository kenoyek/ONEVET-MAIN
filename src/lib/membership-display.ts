export function membershipTerm(months:number){
 if(!Number.isSafeInteger(months)||months<1)return 'Confirm the billing period with support';
 return `per ${months===1?'month':`${months} months`}`;
}
export function membershipPrice(price:number,currency:string){
 if(!Number.isFinite(price)||price<0)return 'Confirm price with support';
 try{return new Intl.NumberFormat('en-NG',{style:'currency',currency,maximumFractionDigits:2}).format(price);}
 catch{return 'Confirm price and currency with support';}
}
export function membershipFeatures(features:unknown):string[]{
 const entries=Array.isArray(features)?features.filter((value):value is string=>typeof value==='string'&&!!value.trim()).map(value=>value.trim()):[];
 return entries.length?entries:['Confirm included benefits and limits with support.'];
}
