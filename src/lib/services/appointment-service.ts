import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
export type Appointment = Database['public']['Tables']['provider_booking_requests']['Row'] & { provider_access?: boolean; provider_eligibility?: 'eligible' | 'unavailable' | 'unknown' };
export type BookingSchedule = Database['public']['Tables']['provider_booking_settings']['Row'];
export type WeeklyWindow = { weekday: number; opens: number; closes: number };
export type BookingView = 'upcoming' | 'needs_response' | 'history' | 'all';
export type BookingDecision = 'confirmed' | 'declined' | 'cancelled' | 'completed';
export function bookingTime(value: string) { return new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) + ' WAT'; }
export function watDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return `${parts.find(part => part.type === 'year')?.value}-${parts.find(part => part.type === 'month')?.value}-${parts.find(part => part.type === 'day')?.value}`;
}
export function snapshotText(value: Appointment['service_snapshot'], key: string) { return value && typeof value === 'object' && !Array.isArray(value) && typeof value[key] === 'string' ? value[key] as string : ''; }
export function appointmentError(error: unknown) {
  if (typeof error === 'object' && error && 'code' in error) {
    if (error.code === '23P01') return 'This slot is no longer available. Refresh times and choose another.';
    if (error.code === '40001') return 'The service, schedule or request changed. Refresh and review the current details before trying again.';
    if (error.code === '42501') return 'This action is unavailable for this account or the provider is no longer eligible. Refresh to check the current status.';
    if (error.code === '23505') return 'A pending alternative already exists for this appointment. Open its details or cancel that alternative before choosing another.';
    if (error.code === '23514') return 'A request limit or schedule rule was reached. Manage existing requests or check your schedule.';
    if (error.code === '22023') return 'Check the animal, phone, address and notes. Schedule windows must use 15-minute boundaries; cancellation or decline needs an explanation.';
  }
  return 'Could not complete the request. Your entries are still here; please try again.';
}
export const appointmentService = {
  async schedule(providerId: string) {
    const { data, error } = await supabase.from('provider_booking_settings').select('*').eq('provider_id', providerId).maybeSingle();
    if (error) throw error; return data;
  },
  async saveSchedule(providerId: string, enabled: boolean, weekly: WeeklyWindow[], dates: string[], version: number) {
    const { data, error } = await supabase.rpc('save_provider_booking_schedule', { provider_uuid: providerId, enabled, weekly, closed_dates: dates, expected_version: version });
    if (error) throw error; return data;
  },
  async service(id: string) {
    const { data, error } = await supabase.from('provider_service_catalog').select('*').eq('id', id).single();
    if (error) throw error; return data;
  },
  async slots(id: string, date: string) {
    const { data, error } = await supabase.rpc('get_provider_booking_slots', { service_uuid: id, local_date: date });
    if (error) throw error; return data;
  },
  async animals(profileId: string) {
    const [pets, farms] = await Promise.all([supabase.from('pets').select('id,name,species').eq('owner_id', profileId), supabase.from('livestock_farms').select('id').eq('owner_id', profileId)]);
    if (pets.error) throw pets.error; if (farms.error) throw farms.error;
    const groups = farms.data.length ? await supabase.from('livestock_batches').select('id,batch_code,species').in('farm_id', farms.data.map(farm => farm.id)).in('status', ['active','quarantined']) : { data: [], error: null };
    if (groups.error) throw groups.error;
    return [...pets.data.map(pet => ({ id: pet.id, kind: 'pet' as const, name: pet.name, species: pet.species })), ...groups.data.map(group => ({ id: group.id, kind: 'farm_group' as const, name: group.batch_code, species: group.species }))];
  },
  async request(input: { serviceId: string; serviceVersion: number; start: string; key: string; animalId: string; kind: 'pet' | 'farm_group'; phone: string; address: string; notes: string }) {
    const { data, error } = await supabase.rpc('request_provider_booking', { service_uuid: input.serviceId, expected_service_version: input.serviceVersion, start_time: input.start, request_key: input.key, ...(input.kind === 'pet' ? { animal_pet: input.animalId } : { animal_batch: input.animalId }), contact_phone: input.phone.trim(), visit_address: input.address.trim(), customer_notes: input.notes.trim() });
    if (error) throw error; return data;
  },
  async list(scope: { customerId: string } | { providerId: string }, page: number, view: BookingView = 'all') {
    let query = supabase.from('provider_booking_requests').select('*').order('start_at', { ascending: view === 'upcoming' || view === 'needs_response' }).order('id');
    query = 'customerId' in scope ? query.eq('customer_id', scope.customerId) : query.eq('provider_id', scope.providerId);
    if (view === 'upcoming') query = query.in('status', ['pending','confirmed']).gte('end_at', new Date().toISOString());
    if (view === 'needs_response') query = query.eq('status', 'pending').gte('start_at', new Date(Date.now() + 30 * 60_000).toISOString());
    if (view === 'history') query = query.in('status', ['declined','cancelled','completed']);
    const { data, error } = await query.range(page * 20, page * 20 + 20);
    if (error) throw error;
    const eligibility = new Map<string, 'eligible' | 'unavailable' | 'unknown'>();
    const operators = new Map<string,boolean>();
    await Promise.all([...new Set(data.slice(0,20).map(row => row.provider_id))].map(async providerId => {
      try { const check = await supabase.rpc('provider_publication_eligible', { provider_uuid: providerId }); eligibility.set(providerId, check.error ? 'unknown' : check.data ? 'eligible' : 'unavailable'); }
      catch { eligibility.set(providerId, 'unknown'); }
      try { const access=await supabase.rpc('has_provider_team_access',{provider_uuid:providerId,capability:'bookings'});operators.set(providerId,!access.error && access.data===true); } catch { operators.set(providerId,false); }
    }));
    return { rows: data.slice(0,20).map(row => ({ ...row, provider_eligibility: eligibility.get(row.provider_id) ?? 'unknown',provider_access:operators.get(row.provider_id)===true })), hasNext: data.length>20 };
  },
  async details(id: string) {
    const { data, error } = await supabase.from('provider_booking_requests').select('*').eq('id', id).single();
    if (error) throw error;
    let eligibility: 'eligible' | 'unavailable' | 'unknown' = 'unknown';
    try { const check = await supabase.rpc('provider_publication_eligible', { provider_uuid: data.provider_id }); eligibility = check.error ? 'unknown' : check.data ? 'eligible' : 'unavailable'; } catch { /* Preserve access to the recorded appointment when rechecking fails. */ }
    let operator=false;
    try { const access=await supabase.rpc('has_provider_team_access',{provider_uuid:data.provider_id,capability:'bookings'});operator=!access.error && access.data===true; } catch { /* A failed permission check must not enable provider actions. */ }
    return { ...data, provider_eligibility: eligibility,provider_access:operator };
  },
  async replacements(id: string) {
    const { data, error } = await supabase.from('provider_booking_requests').select('id,status,start_at').eq('replacement_for', id).order('created_at', { ascending: false }).order('id').limit(50);
    if (error) throw error; return data;
  },
  async rescheduleSlots(id: string, date: string) {
    const { data, error } = await supabase.rpc('get_booking_reschedule_slots', { booking_uuid: id, local_date: date });
    if (error) throw error; return data;
  },
  async reschedule(input: { bookingId: string; bookingVersion: number; serviceVersion: number; start: string; key: string; reason: string }) {
    const { data, error } = await supabase.rpc('request_booking_reschedule', { booking_uuid: input.bookingId, expected_booking_version: input.bookingVersion, expected_service_version: input.serviceVersion, start_time: input.start, request_key: input.key, reason: input.reason.trim() });
    if (error) throw error; return data;
  },
  async respond(booking: Pick<Appointment,'id'|'version'>, decision: BookingDecision, note: string) {
    const { data, error } = await supabase.rpc('respond_provider_booking', { booking_uuid: booking.id, expected_version: booking.version, decision, response_note: note.trim() });
    if (error) throw error; return data;
  },
  async history(id: string) {
    const { data, error } = await supabase.from('provider_booking_events').select('*').eq('booking_id', id).order('version', { ascending: false });
    if (error) throw error; return data;
  },
};
