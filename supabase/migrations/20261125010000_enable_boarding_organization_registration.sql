ALTER TABLE public.provider_organizations
  DROP CONSTRAINT provider_organizations_provider_type_check,
  ADD CONSTRAINT provider_organizations_provider_type_check CHECK (
    provider_type IN (
      'veterinary_clinic', 'independent_veterinarian', 'grooming_business',
      'diagnostic_laboratory', 'pharmacy', 'pet_store', 'pet_trainer',
      'mobile_service_provider', 'boarding_facility'
    )
  );
