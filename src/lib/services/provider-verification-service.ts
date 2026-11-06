import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
export type VerificationCase = Database['public']['Tables']['provider_verification_cases']['Row'];
export type ProviderEvidence = Database['public']['Tables']['provider_documents']['Row'];
export const evidenceKinds = { business_registration: 'Business registration', professional_license: 'Professional licence', supporting_document: 'Supporting document' } as const;
export type EvidenceKind = keyof typeof evidenceKinds;
export type ReviewDecision = 'under_review' | 'more_info_required' | 'approved' | 'rejected' | 'suspended';
const bucket = 'provider-credentials';
const extensions: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };
export function validateEvidenceFile(file: File) {
  if (!extensions[file.type]) throw new Error('Choose a PDF, JPEG or PNG document.');
  if (file.size === 0 || file.size > 10 * 1024 * 1024) throw new Error('Choose a non-empty document up to 10 MB.');
}
export function verificationError(error: unknown): string {
  if (error instanceof Error && (error.message.startsWith('Choose ') || error.message.startsWith('Provide '))) return error.message;
  if (typeof error === 'object' && error && 'code' in error) {
    if (error.code === '40001') return 'This application changed. Refresh it before reviewing.';
    if (error.code === '42501') return 'You cannot perform this action. Refresh to check the current status.';
    if (error.code === '22023') return 'This action is not available. Check the current status, document expiry, required licence evidence and individual veterinary approval.';
    if (error.code === '23514') return 'The document limit has been reached. Contact support.';
  }
  return 'The request could not be completed. Your entries are still here; please try again.';
}
export const providerVerificationService = {
  async evidence(providerId: string) {
    const { data, error } = await supabase.from('provider_documents').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async application(providerId: string) {
    const { data, error } = await supabase.from('provider_verification_cases').select('*').eq('provider_id', providerId).maybeSingle();
    if (error) throw error;
    return data;
  },
  async history(providerId: string) {
    const { data, error } = await supabase.from('provider_verification_events').select('*').eq('provider_id', providerId).order('revision', { ascending: false }).limit(50);
    if (error) throw error;
    return data;
  },
  async upload(providerId: string, file: File) {
    validateEvidenceFile(file);
    const path = `${providerId}/${crypto.randomUUID()}.${extensions[file.type]}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return path;
  },
  async register(providerId: string, kind: EvidenceKind, path: string, expiry: string) {
    const { data, error } = await supabase.rpc('register_provider_evidence', { provider_uuid: providerId, kind, object_path: path, ...(expiry ? { expiry } : {}) });
    if (error) throw error;
    return data;
  },
  async signedUrl(path: string) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
    if (error) throw error;
    return data.signedUrl;
  },
  async submit(providerId: string) {
    const { data, error } = await supabase.rpc('submit_provider_verification', { provider_uuid: providerId });
    if (error) throw error;
    return data;
  },
  async review(application: VerificationCase, decision: ReviewDecision, feedback: string) {
    const note = feedback.trim();
    if (note.length > 3000 || (['more_info_required', 'rejected', 'suspended'].includes(decision) && note.length < 10)) throw new Error('Provide a clear explanation of 10–3000 characters for the owner.');
    const { data, error } = await supabase.rpc('review_provider_verification', { provider_uuid: application.provider_id, expected_revision: application.revision, decision, owner_feedback: note });
    if (error) throw error;
    return data;
  },
  async queue(statuses: string[], page: number) {
    const { data, error } = await supabase.from('provider_verification_cases').select('*, organization:provider_organizations(*)').in('status', statuses).order('submitted_at', { ascending: false }).order('id').range(page * 20, page * 20 + 20);
    if (error) throw error;
    return { cases: data.slice(0, 20), hasNext: data.length > 20 };
  },
};
