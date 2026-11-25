export function registrationIntent(role: string | null) {
  const value = (role || '').trim().toLowerCase();
  const categories: Record<string, string> = {
    veterinarian: 'Veterinarian', vet: 'Veterinarian', independent_veterinarian: 'Veterinarian',
    groomer: 'Groomer', grooming_business: 'Groomer',
    vendor: 'Vendor Store', vendor_store: 'Vendor Store', pet_store: 'Vendor Store',
    boarding: 'Boarding Facility', boarding_facility: 'Boarding Facility',
    clinic_admin: 'Veterinary Clinic', veterinary_clinic: 'Veterinary Clinic',
    laboratory: 'Diagnostic Laboratory', diagnostic_laboratory: 'Diagnostic Laboratory',
    pharmacy: 'Veterinary Pharmacy', veterinary_pharmacy: 'Veterinary Pharmacy',
    trainer: 'Pet Trainer', pet_trainer: 'Pet Trainer',
    mobile_service_provider: 'Mobile Service Provider',
  };
  const providerCategory = Object.hasOwn(categories, value) ? categories[value] : '';
  const provider = Boolean(providerCategory) || ['provider', 'service_provider', 'business'].includes(value);
  return { audience: provider ? 'provider' as const : ['client','owner','pet_owner','farm_owner','farmer'].includes(value) ? 'client' as const : null,
    providerCategory, customerType: ['farm_owner','farmer'].includes(value) ? 'farm_owner' as const : 'pet_owner' as const };
}
