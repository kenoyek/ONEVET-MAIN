/** A navigation hint only; booking choices must still be checked against owned records. */
export function bookingAnimalContext(value: string | null | undefined): string {
  return value && /^(pet|farm_group):[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : '';
}
export function withBookingAnimal(path: string, value: string | null | undefined): string {
  const animal = bookingAnimalContext(value);
  if (!animal) return path;
  const url = new URL(path, 'https://1vet.store');
  url.searchParams.set('animal', animal);
  return url.pathname + url.search + url.hash;
}
