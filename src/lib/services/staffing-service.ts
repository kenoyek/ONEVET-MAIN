import { plannedSupabase as supabase } from '@/integrations/supabase/planned-client';

export interface CreateStaffShiftInput {
  provider_id: string;
  location_id: string;
  staff_member_id: string; // provider_members.id
  shift_date: string;
  start_time: string;
  end_time: string;
  role_on_shift?: string;
}

export interface CreateFacilityRoomInput {
  location_id: string;
  room_name: string;
  room_type: string;
}

export interface SetOperatingHoursInput {
  location_id: string;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed?: boolean;
}

export const staffingService = {
  /**
   * Schedule a staff shift at a location
   */
  async createStaffShift(input: CreateStaffShiftInput) {
    const { data, error } = await supabase
      .from('staff_shifts')
      .insert({
        provider_id: input.provider_id,
        location_id: input.location_id,
        staff_member_id: input.staff_member_id,
        shift_date: input.shift_date,
        start_time: input.start_time,
        end_time: input.end_time,
        role_on_shift: input.role_on_shift || null,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Clock in to an assigned shift
   */
  async clockInShift(shiftId: string) {
    const { data, error } = await supabase
      .from('staff_shifts')
      .update({
        status: 'clocked_in',
        clock_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', shiftId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Clock out of a shift
   */
  async clockOutShift(shiftId: string) {
    const { data, error } = await supabase
      .from('staff_shifts')
      .update({
        status: 'clocked_out',
        clock_out_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', shiftId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a facility room or exam suite
   */
  async createFacilityRoom(input: CreateFacilityRoomInput) {
    const { data, error } = await supabase
      .from('facility_rooms')
      .insert({
        location_id: input.location_id,
        room_name: input.room_name,
        room_type: input.room_type,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Set location operating hours
   */
  async setLocationOperatingHours(input: SetOperatingHoursInput) {
    const { data, error } = await supabase
      .from('location_operating_hours')
      .upsert({
        location_id: input.location_id,
        day_of_week: input.day_of_week,
        opens_at: input.opens_at,
        closes_at: input.closes_at,
        is_closed: input.is_closed ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
