import { licenseBelongsToApplicant } from '@/lib/services/license-service';

export interface VetOnboardingProfile {
  user_id: string;
  license_number: string | null;
  license_url?: string | null;
  license_verified: boolean | null;
  verification_status?: string | null;
  is_active?: boolean | null;
}

export function vetOnboardingStatus(profile: VetOnboardingProfile | null) {
  const hasNumber = !!profile?.license_number?.trim();
  const hasDocument = !!profile && licenseBelongsToApplicant(profile.license_url ?? null, profile.user_id);
  const checklist = [
    { label: 'Licence number saved', complete: hasNumber },
    { label: 'Applicant-owned licence document uploaded', complete: hasDocument },
  ];
  if (profile?.is_active === false) return { label: 'Account inactive', description: 'Contact support to restore your account before accepting consultations.', action: 'Contact support', href: '/contact', checklist, approved: false };
  if (profile?.verification_status === 'approved' && profile.license_verified && profile.is_active === true) return { label: 'Professionally approved', description: 'Your professional approval is complete. You can manage your consultation availability.', action: 'View professional details', href: '/profile#credentials', checklist, approved: true };
  if (profile?.verification_status === 'rejected') return { label: 'Application needs attention', description: 'Review your saved licence details and upload a corrected document to return your application for review. Contact support if you need clarification.', action: 'Update licence details', href: '/profile#credentials', checklist, approved: false };
  if (!hasNumber || !hasDocument) return { label: 'Complete your professional details', description: 'Save your licence number and upload your veterinary licence. Both are needed before your application is ready for review.', action: 'Complete licence details', href: '/profile#credentials', checklist, approved: false };
  if (profile?.verification_status === 'pending') return { label: 'Awaiting professional review', description: 'Your saved licence details are ready for administrator review. Approval is required before accepting consultations. You do not need to upload the same document again.', action: 'View submitted details', href: '/profile#credentials', checklist, approved: false };
  return { label: 'Approval needs confirmation', description: 'Your licence details are saved, but professional approval is not complete. Contact support before accepting consultations.', action: 'Contact support', href: '/contact', checklist, approved: false };
}
