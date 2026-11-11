export function registrationIntent(role: string | null) {
  const value = (role || '').toLowerCase();
  const categories: Record<string, string> = { veterinarian: 'Veterinarian', vet: 'Veterinarian', groomer: 'Groomer', vendor: 'Vendor Store', vendor_store: 'Vendor Store', boarding: 'Boarding Facility' };
  const provider = ['provider', 'service_provider', 'business', ...Object.keys(categories)].includes(value);
  return { audience: provider ? 'provider' as const : ['client','owner','pet_owner','farm_owner','farmer'].includes(value) ? 'client' as const : null,
    providerCategory: categories[value] || '', customerType: ['farm_owner','farmer'].includes(value) ? 'farm_owner' as const : 'pet_owner' as const };
}
