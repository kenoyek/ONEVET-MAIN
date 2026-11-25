import type { Database } from './types';

// Reviewed against migrations, not presented as a generated snapshot of the live database.
export type FarmRecord = {
  id: string;
  owner_id: string;
  farm_name: string;
  registration_number: string | null;
  farm_type: string;
  location_address: string;
  city: string;
  state: string;
  total_acreage: number | null;
  created_at: string;
  updated_at: string;
};
export type BatchRecord = {
  id: string;
  farm_id: string;
  batch_code: string;
  species: string;
  breed: string | null;
  head_count: number;
  purpose: string | null;
  housing_unit: string | null;
  status: 'active' | 'quarantined' | 'sold' | 'archived';
  created_at: string;
};
export type FlockHealthRecord = {
  id: string;
  batch_id: string;
  attending_vet_id: string | null;
  recorded_by_id: string;
  record_type: string;
  affected_count: number;
  mortality_count: number;
  observations: string;
  treatment_administered: string | null;
  withdrawal_period_days: number;
  recorded_at: string;
  created_at: string;
};
type Table<Row extends Record<string, unknown>, Required extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};
export type CustomerDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables' | 'Views' | 'Functions'> & {
    Views: Database['public']['Views'] & {
      shop_catalogue: {
        Row: Database['public']['Tables']['marketplace_listings']['Row'] & { seller_name: string };
        Relationships: [];
      };
      care_service_directory: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          base_price: number;
          currency: string;
          location: string | null;
          provider_id: string;
          first_name: string;
          last_name: string;
          business_name: string | null;
          specialty: string | null;
          avatar_url: string | null;
          license_verified: boolean;
          verification_status: string;
        };
        Relationships: [];
      };
    };
    Functions: Omit<Database['public']['Functions'],'add_pet_owner_health_entry'> & {
      care_chat_assign: { Args: { chat_id: string; expected_owner: string | null; release_chat: boolean }; Returns: import('./types').Json };
      get_public_boarding_facility: { Args: { facility_slug: string }; Returns: import('./types').Json };
      list_public_boarding_facilities: { Args: { city_query: string | null; after_slug: string | null; state_query?: string | null }; Returns: import('./types').Json };
      set_boarding_listing: { Args: { provider_uuid: string; publish: boolean }; Returns: boolean };
      list_support_message_notes: { Args: { target_message: string; before_note: number | null }; Returns: import('./types').Json };
      add_support_message_note: { Args: { target_message: string; note_request: string; note_body: string }; Returns: undefined };
      support_inbox_totals: { Args: Record<PropertyKey, never>; Returns: import('./types').Json };
      list_support_messages: { Args: { message_filter: string; before_created_at: string | null; before_id: string | null; search_text: string | null }; Returns: import('./types').Json };
      set_support_message_resolved: { Args: { message_id: string; resolved_state: boolean }; Returns: string | null };
      set_support_message_read: { Args: { message_id: string; read_state: boolean }; Returns: boolean };
      care_chat_visitor_end: { Args: { guest_key: string }; Returns: import('./types').Json };
      care_chat_reply_pending: { Args: { guest_key: string; after_id: number }; Returns: boolean };
      care_chat_waiting_count: { Args: Record<PropertyKey, never>; Returns: number };
      care_chat_is_available: { Args: Record<PropertyKey, never>; Returns: boolean };
      care_chat_staff_availability: { Args: { accepting?: boolean }; Returns: string | null };
      care_chat_visitor: { Args: { guest_key: string; message_key?: string; message_body?: string }; Returns: import('./types').Json };
      care_chat_inbox_page: { Args: { filter_status: string; after_updated_at: string | null; after_chat_id: string | null; filter_assignment: string; sort_by_first_wait: boolean }; Returns: import('./types').Json };
      care_chat_staff: { Args: { chat_id: string; message_key: string | null; message_body: string | null; close_chat: boolean; booking_category_arg: string | null }; Returns: import('./types').Json };
      list_article_comment_review_history: { Args: { before_id: number | null; decision_action: string | null; article_query: string | null }; Returns: import('./types').Json };
      report_article_comment: { Args: { target_comment: string; report_reason: string }; Returns: undefined };
      list_article_comment_reports: { Args: Record<PropertyKey, never>; Returns: import('./types').Json };
      resolve_article_comment_reports: { Args: { target_comment: string; remove_comment: boolean; decision_note: string | null }; Returns: undefined };
      get_article_engagement: {Args:{article_uuid:string;before_ordinal?:number};Returns:import('./types').Json};
      set_article_like: {Args:{article_uuid:string;liked:boolean};Returns:undefined};
      add_article_comment: {Args:{article_uuid:string;comment_id:string;comment_body:string};Returns:string};
      remove_article_comment: {Args:{article_uuid:string;comment_id:string};Returns:undefined};
      // PostgREST generation omits SQL argument nullability. These two values
      // must be explicitly null for entry kinds that do not use them.
      add_pet_owner_health_entry: {
        Args: Omit<Database['public']['Functions']['add_pet_owner_health_entry']['Args'],'weight_value'|'due_date'> & {weight_value:number|null;due_date:string|null};
        Returns: Database['public']['Functions']['add_pet_owner_health_entry']['Returns'];
      };
      site_analytics_report: {Args:{window_days?:number;country_filter?:string|null};Returns:import('./types').Json};
      rotate_site_analytics_key:{Args:Record<PropertyKey,never>;Returns:string};
      admin_shop_sellers: { Args: Record<PropertyKey, never>; Returns: { id:string; name:string }[] };
      admin_save_shop_product: { Args: {product_uuid:string;details:import('./types').Json;expected_updated_at?:string|null}; Returns:{id:string;updated_at:string}[] };
      claim_consultation: {
        Args: { consultation_uuid: string };
        Returns: string;
      };
    };
    Tables: Database['public']['Tables'] & {
      profiles: Omit<
        Database['public']['Tables']['profiles'],
        'Row' | 'Insert' | 'Update'
      > & {
        Row: Database['public']['Tables']['profiles']['Row'] & {
          customer_type: string | null;
        };
        Insert: Database['public']['Tables']['profiles']['Insert'] & {
          customer_type?: string | null;
        };
        Update: Database['public']['Tables']['profiles']['Update'] & {
          customer_type?: string | null;
        };
      };
      orders: Table<
        {
          id: string;
          customer_id: string;
          total_amount: number;
          status: string;
          payment_status: string;
          payment_reference: string | null;
          shipping_address: string;
          phone_number: string;
          created_at: string;
          updated_at: string;
        },
        'customer_id' | 'total_amount' | 'shipping_address' | 'phone_number'
      >;
      livestock_farms: Table<
        FarmRecord,
        | 'owner_id'
        | 'farm_name'
        | 'farm_type'
        | 'location_address'
        | 'city'
        | 'state'
      >;
      livestock_batches: Table<
        BatchRecord,
        'farm_id' | 'batch_code' | 'species' | 'head_count'
      >;
      flock_health_records: Table<
        FlockHealthRecord,
        'batch_id' | 'recorded_by_id' | 'record_type' | 'observations'
      >;
    };
  };
};
