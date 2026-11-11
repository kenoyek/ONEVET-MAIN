export function petBookingReturn(value: string | null): string | null {
  if(!value || !value.startsWith('/booking/new?') || value.includes('\\') || Array.from(value).some(char=>char.charCodeAt(0)<=32))return null;
  const url=new URL(value,'https://1vet.store');
  return url.pathname==='/booking/new'&&!!url.searchParams.get('service_id') ? url.pathname+url.search : null;
}
