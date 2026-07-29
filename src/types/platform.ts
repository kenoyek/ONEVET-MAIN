/**
 * Shared platform domain types and enums for 1vet Pet HMO & Multi-Provider Ecosystem.
 */

// ── Role & Permission Types ──────────────────────────────────────────────────

export type CoreRole =
  | 'client'
  | 'veterinarian'
  | 'clinic_admin'
  | 'groomer'
  | 'laboratory'
  | 'pharmacy'
  | 'vendor'
  | 'trainer'
  | 'provider_staff'
  | 'support_agent'
  | 'admin'
  | 'super_admin';

/** Legacy DB app_role enum compatibility mapping */
export type LegacyAppRole = 'pet_owner' | 'veterinarian' | 'service_provider' | 'admin';

export type ProviderType =
  | 'veterinary_clinic'
  | 'independent_veterinarian'
  | 'grooming_business'
  | 'diagnostic_laboratory'
  | 'pharmacy'
  | 'pet_store'
  | 'pet_trainer'
  | 'mobile_service_provider';

export type ProviderVerificationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'more_info_required'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'deactivated';

export type VerificationRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type DocumentType =
  | 'identity_document'
  | 'veterinary_license'
  | 'business_registration'
  | 'operating_permit'
  | 'certification'
  | 'proof_of_address'
  | 'facility_photo';

// ── Pet & Clinical Types ─────────────────────────────────────────────────────

export type SpeciesType =
  | 'dog'
  | 'cat'
  | 'bird'
  | 'rabbit'
  | 'fish'
  | 'cattle'
  | 'goat'
  | 'sheep'
  | 'poultry'
  | 'pig'
  | 'horse'
  | 'other';

export type CaregiverPermissionLevel =
  | 'view_only'
  | 'manage_bookings'
  | 'manage_health_records'
  | 'full_owner_access';

export type ServiceDeliveryMode = 'video' | 'voice' | 'chat' | 'clinic_visit' | 'home_visit' | 'asynchronous';

export type BookingStatus =
  | 'pending'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_client'
  | 'cancelled_by_provider'
  | 'no_show'
  | 'rescheduled'
  | 'refunded'
  | 'disputed';

export type ConsultationStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';

// ── Entity Interfaces for Next Phases ────────────────────────────────────────

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: CoreRole | LegacyAppRole;
  created_at: string;
  created_by?: string | null;
}

export interface ProviderOrganization {
  id: string;
  name: string;
  slug: string;
  provider_type: ProviderType;
  description?: string | null;
  logo_url?: string | null;
  email: string;
  phone?: string | null;
  website?: string | null;
  country: string;
  state?: string | null;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone: string;
  currency: string;
  status: 'active' | 'inactive' | 'suspended';
  verification_status: ProviderVerificationStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderMember {
  id: string;
  provider_id: string;
  user_id: string;
  member_role: 'owner' | 'manager' | 'staff' | 'practitioner';
  permissions: string[];
  status: 'active' | 'invited' | 'suspended';
  invited_by?: string | null;
  joined_at?: string | null;
}

export interface ProviderLocation {
  id: string;
  provider_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  timezone: string;
  is_primary: boolean;
  is_active: boolean;
}

// ── Admin Analytics & Reporting Types ─────────────────────────────────────────

export interface ChartDataPoint {
  date?: string;
  month?: string;
  name?: string;
  value?: number;
  count?: number;
  amount?: number;
  consultations?: number;
  revenue?: number;
  users?: number;
  [key: string]: string | number | undefined;
}

export interface VerificationRequestItem {
  id: string;
  user_id: string;
  business_name?: string | null;
  license_number?: string | null;
  verification_status: string;
  created_at: string;
  profiles?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  [key: string]: unknown;
}

export interface PaystackTransactionResponse {
  reference: string;
  status?: string;
  trans?: string;
  transaction?: string;
  message?: string;
  [key: string]: unknown;
}

export interface GenericRecord {
  id: string;
  [key: string]: unknown;
}
