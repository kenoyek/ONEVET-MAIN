export const serviceCategoryLabels:Record<string,string>={veterinary:'Veterinary care',grooming:'Grooming',diagnostics:'Diagnostics & labs',training:'Training & behaviour'};
export function serviceFee(price:number|null|undefined,currency:string|null|undefined){
 if(price==null||!Number.isFinite(price)||price<0||!currency||!/^[A-Z]{3}$/.test(currency))return 'Confirm with provider';
 return `${currency} ${price.toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
}
export function serviceDelivery(mode:string|null|undefined){
 return mode==='home_visit'?'Home visit':mode==='clinic_visit'?'At provider location':'Confirm delivery with provider';
}
