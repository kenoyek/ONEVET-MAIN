export function animalProfileToday(now = new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  return `${parts.find(p=>p.type==='year')?.value}-${parts.find(p=>p.type==='month')?.value}-${parts.find(p=>p.type==='day')?.value}`;
}
export function validAnimalBirthDate(value: string | undefined, today = animalProfileToday()) {
  if(!value)return true;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||value>today)return false;
  const date=new Date(value+'T12:00:00Z');
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
