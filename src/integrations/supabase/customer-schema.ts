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
    Functions: Database['public']['Functions'] & {
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
