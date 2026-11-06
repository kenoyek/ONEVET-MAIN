export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          author_id: string | null
          category: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category: string
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          listing_id: string
          notes: string | null
          pet_id: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          listing_id: string
          notes?: string | null
          pet_id?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          listing_id?: string
          notes?: string | null
          pet_id?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "care_service_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "service_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          chief_complaint: string
          completed_at: string | null
          created_at: string
          diagnosis: string | null
          id: string
          is_urgent: boolean
          notes: string | null
          pet_id: string | null
          pet_owner_id: string
          prescription: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["consultation_status"]
          updated_at: string
          veterinarian_id: string | null
        }
        Insert: {
          chief_complaint: string
          completed_at?: string | null
          created_at?: string
          diagnosis?: string | null
          id?: string
          is_urgent?: boolean
          notes?: string | null
          pet_id?: string | null
          pet_owner_id: string
          prescription?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["consultation_status"]
          updated_at?: string
          veterinarian_id?: string | null
        }
        Update: {
          chief_complaint?: string
          completed_at?: string | null
          created_at?: string
          diagnosis?: string | null
          id?: string
          is_urgent?: boolean
          notes?: string | null
          pet_id?: string | null
          pet_owner_id?: string
          prescription?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["consultation_status"]
          updated_at?: string
          veterinarian_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_pet_owner_id_fkey"
            columns: ["pet_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_pet_owner_id_fkey"
            columns: ["pet_owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      flock_health_records: {
        Row: {
          affected_count: number | null
          attending_vet_id: string | null
          batch_id: string
          created_at: string
          id: string
          mortality_count: number | null
          observations: string
          record_type: string
          recorded_at: string
          recorded_by_id: string
          treatment_administered: string | null
          withdrawal_period_days: number | null
        }
        Insert: {
          affected_count?: number | null
          attending_vet_id?: string | null
          batch_id: string
          created_at?: string
          id?: string
          mortality_count?: number | null
          observations: string
          record_type: string
          recorded_at?: string
          recorded_by_id: string
          treatment_administered?: string | null
          withdrawal_period_days?: number | null
        }
        Update: {
          affected_count?: number | null
          attending_vet_id?: string | null
          batch_id?: string
          created_at?: string
          id?: string
          mortality_count?: number | null
          observations?: string
          record_type?: string
          recorded_at?: string
          recorded_by_id?: string
          treatment_administered?: string | null
          withdrawal_period_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "flock_health_records_attending_vet_id_fkey"
            columns: ["attending_vet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flock_health_records_attending_vet_id_fkey"
            columns: ["attending_vet_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flock_health_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "livestock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flock_health_records_recorded_by_id_fkey"
            columns: ["recorded_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flock_health_records_recorded_by_id_fkey"
            columns: ["recorded_by_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock_batches: {
        Row: {
          batch_code: string
          breed: string | null
          created_at: string
          farm_id: string
          head_count: number
          housing_unit: string | null
          id: string
          purpose: string | null
          species: string
          status: string
        }
        Insert: {
          batch_code: string
          breed?: string | null
          created_at?: string
          farm_id: string
          head_count?: number
          housing_unit?: string | null
          id?: string
          purpose?: string | null
          species: string
          status?: string
        }
        Update: {
          batch_code?: string
          breed?: string | null
          created_at?: string
          farm_id?: string
          head_count?: number
          housing_unit?: string | null
          id?: string
          purpose?: string | null
          species?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestock_batches_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "livestock_farms"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock_farms: {
        Row: {
          city: string
          created_at: string
          farm_name: string
          farm_type: string
          id: string
          location_address: string
          owner_id: string
          registration_number: string | null
          state: string
          total_acreage: number | null
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          farm_name: string
          farm_type: string
          id?: string
          location_address: string
          owner_id: string
          registration_number?: string | null
          state: string
          total_acreage?: number | null
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          farm_name?: string
          farm_type?: string
          id?: string
          location_address?: string
          owner_id?: string
          registration_number?: string | null
          state?: string
          total_acreage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestock_farms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livestock_farms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_approved: boolean | null
          location: string | null
          price: number
          seller_id: string
          stock_quantity: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_approved?: boolean | null
          location?: string | null
          price: number
          seller_id: string
          stock_quantity?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_approved?: boolean | null
          location?: string | null
          price?: number
          seller_id?: string
          stock_quantity?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          consultation_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          consultation_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          consultation_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          seller_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          seller_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          seller_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          payment_reference: string | null
          payment_status: string
          phone_number: string
          shipping_address: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          payment_reference?: string | null
          payment_status?: string
          phone_number: string
          shipping_address: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          payment_reference?: string | null
          payment_status?: string
          phone_number?: string
          shipping_address?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_receipts: {
        Row: {
          amount_kobo: number
          created_at: string
          currency: string
          payment_type: string
          reference: string
          target_id: string
          user_id: string
        }
        Insert: {
          amount_kobo: number
          created_at?: string
          currency: string
          payment_type: string
          reference: string
          target_id: string
          user_id: string
        }
        Update: {
          amount_kobo?: number
          created_at?: string
          currency?: string
          payment_type?: string
          reference?: string
          target_id?: string
          user_id?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          avatar_url: string | null
          breed: string | null
          created_at: string
          date_of_birth: string | null
          gender: string | null
          id: string
          is_livestock: boolean | null
          livestock_count: number | null
          medical_notes: string | null
          name: string
          owner_id: string
          species: Database["public"]["Enums"]["species_type"]
          updated_at: string
          vaccination_history: Json | null
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          breed?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          is_livestock?: boolean | null
          livestock_count?: number | null
          medical_notes?: string | null
          name: string
          owner_id: string
          species: Database["public"]["Enums"]["species_type"]
          updated_at?: string
          vaccination_history?: Json | null
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          breed?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          is_livestock?: boolean | null
          livestock_count?: number | null
          medical_notes?: string | null
          name?: string
          owner_id?: string
          species?: Database["public"]["Enums"]["species_type"]
          updated_at?: string
          vaccination_history?: Json | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_address: string | null
          business_name: string | null
          city: string | null
          country: string | null
          created_at: string
          customer_type: string | null
          email: string | null
          email_verified: boolean | null
          first_name: string
          id: string
          is_active: boolean | null
          is_available: boolean | null
          last_login: string | null
          last_name: string
          license_number: string | null
          license_url: string | null
          license_verified: boolean | null
          location: string | null
          phone: string | null
          phone_verified: boolean | null
          profile_completed: boolean | null
          specialty: string | null
          state: string | null
          updated_at: string
          user_id: string
          vendor_type: string | null
          verification_status:
            | Database["public"]["Enums"]["vendor_status"]
            | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_address?: string | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          customer_type?: string | null
          email?: string | null
          email_verified?: boolean | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          last_login?: string | null
          last_name?: string
          license_number?: string | null
          license_url?: string | null
          license_verified?: boolean | null
          location?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          profile_completed?: boolean | null
          specialty?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          vendor_type?: string | null
          verification_status?:
            | Database["public"]["Enums"]["vendor_status"]
            | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_address?: string | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          customer_type?: string | null
          email?: string | null
          email_verified?: boolean | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          last_login?: string | null
          last_name?: string
          license_number?: string | null
          license_url?: string | null
          license_verified?: boolean | null
          location?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          profile_completed?: boolean | null
          specialty?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          vendor_type?: string | null
          verification_status?:
            | Database["public"]["Enums"]["vendor_status"]
            | null
        }
        Relationships: []
      }
      provider_documents: {
        Row: {
          created_at: string
          document_type: string
          expires_at: string | null
          file_path: string
          id: string
          is_current: boolean
          provider_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type: string
          expires_at?: string | null
          file_path: string
          id?: string
          is_current?: boolean
          provider_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_type?: string
          expires_at?: string | null
          file_path?: string
          id?: string
          is_current?: boolean
          provider_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_documents_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_locations: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          id: string
          is_active: boolean
          is_primary: boolean
          name: string
          phone: string
          provider_id: string
          state: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          name: string
          phone?: string
          provider_id: string
          state: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          name?: string
          phone?: string
          provider_id?: string
          state?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_locations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string
          member_role: string
          permissions: Json
          provider_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          member_role: string
          permissions?: Json
          provider_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          member_role?: string
          permissions?: Json
          provider_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_members_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_organizations: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          created_by: string
          currency: string
          description: string
          email: string
          id: string
          name: string
          phone: string
          provider_type: string
          slug: string
          state: string
          status: string
          timezone: string
          updated_at: string
          verification_status: string
          website: string
        }
        Insert: {
          address: string
          city: string
          country?: string
          created_at?: string
          created_by: string
          currency?: string
          description?: string
          email: string
          id?: string
          name: string
          phone?: string
          provider_type: string
          slug: string
          state: string
          status?: string
          timezone?: string
          updated_at?: string
          verification_status?: string
          website?: string
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          created_by?: string
          currency?: string
          description?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          provider_type?: string
          slug?: string
          state?: string
          status?: string
          timezone?: string
          updated_at?: string
          verification_status?: string
          website?: string
        }
        Relationships: []
      }
      provider_services: {
        Row: {
          base_price: number
          category: string
          created_at: string
          currency: string
          delivery_mode: string
          description: string
          duration_minutes: number
          id: string
          is_published: boolean
          name: string
          provider_id: string
          updated_at: string
          version: number
        }
        Insert: {
          base_price: number
          category: string
          created_at?: string
          currency?: string
          delivery_mode: string
          description: string
          duration_minutes: number
          id?: string
          is_published?: boolean
          name: string
          provider_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string
          currency?: string
          delivery_mode?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_published?: boolean
          name?: string
          provider_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_verification_cases: {
        Row: {
          document_ids: string[]
          feedback: string
          id: string
          organization_snapshot: Json
          provider_id: string
          reviewed_by: string | null
          revision: number
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          document_ids: string[]
          feedback?: string
          id?: string
          organization_snapshot: Json
          provider_id: string
          reviewed_by?: string | null
          revision?: number
          status: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          document_ids?: string[]
          feedback?: string
          id?: string
          organization_snapshot?: Json
          provider_id?: string
          reviewed_by?: string | null
          revision?: number
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_verification_cases_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "provider_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_verification_events: {
        Row: {
          actor_id: string
          case_id: string
          created_at: string
          document_ids: string[] | null
          feedback: string
          id: string
          organization_snapshot: Json | null
          provider_id: string
          revision: number
          status: string
        }
        Insert: {
          actor_id: string
          case_id: string
          created_at?: string
          document_ids?: string[] | null
          feedback?: string
          id?: string
          organization_snapshot?: Json | null
          provider_id: string
          revision: number
          status: string
        }
        Update: {
          actor_id?: string
          case_id?: string
          created_at?: string
          document_ids?: string[] | null
          feedback?: string
          id?: string
          organization_snapshot?: Json | null
          provider_id?: string
          revision?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_verification_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "provider_verification_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_verification_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          consultation_id: string | null
          created_at: string
          id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          consultation_id?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          consultation_id?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_listings: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: string | null
          price: number | null
          price_unit: string | null
          provider_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          price?: number | null
          price_unit?: string | null
          provider_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          price?: number | null
          price_unit?: string | null
          provider_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_listings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_listings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          duration_months: number
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string | null
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vet_presence: {
        Row: {
          id: string
          is_online: boolean | null
          last_seen_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_online?: boolean | null
          last_seen_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_online?: boolean | null
          last_seen_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      care_service_directory: {
        Row: {
          avatar_url: string | null
          base_price: number | null
          business_name: string | null
          category: string | null
          currency: string | null
          description: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          license_verified: boolean | null
          location: string | null
          name: string | null
          provider_id: string | null
          specialty: string | null
          verification_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_listings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_listings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_service_catalog: {
        Row: {
          base_price: number | null
          category: string | null
          city: string | null
          country: string | null
          currency: string | null
          delivery_mode: string | null
          description: string | null
          duration_minutes: number | null
          id: string | null
          name: string | null
          organization_name: string | null
          provider_id: string | null
          provider_slug: string | null
          provider_type: string | null
          state: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_name: string | null
          created_at: string | null
          customer_type: string | null
          first_name: string | null
          id: string | null
          is_available: boolean | null
          last_name: string | null
          license_verified: boolean | null
          location: string | null
          specialty: string | null
          user_id: string | null
          vendor_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string | null
          customer_type?: string | null
          first_name?: string | null
          id?: string | null
          is_available?: boolean | null
          last_name?: string | null
          license_verified?: boolean | null
          location?: string | null
          specialty?: string | null
          user_id?: string | null
          vendor_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string | null
          customer_type?: string | null
          first_name?: string | null
          id?: string | null
          is_available?: boolean | null
          last_name?: string | null
          license_verified?: boolean | null
          location?: string | null
          specialty?: string | null
          user_id?: string | null
          vendor_type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_edit_provider_evidence: {
        Args: { provider_uuid: string }
        Returns: boolean
      }
      can_upload_provider_evidence: {
        Args: { object_name: string }
        Returns: boolean
      }
      claim_consultation: {
        Args: { consultation_uuid: string }
        Returns: string
      }
      finalize_verified_payment: {
        Args: {
          p_amount_kobo: number
          p_currency: string
          p_reference: string
          p_target_id: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_online_vets_count: { Args: never; Returns: number }
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      get_unread_message_count: { Args: { p_user_id: string }; Returns: number }
      get_unread_notification_count: {
        Args: { _user_id: string }
        Returns: number
      }
      grant_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      handle_order_payment: {
        Args: { p_order_id: string; p_payment_reference: string }
        Returns: undefined
      }
      handle_subscription_payment: {
        Args: {
          p_payment_reference: string
          p_plan_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_consultation_participant: {
        Args: { _consultation_id: string; _user_id: string }
        Returns: boolean
      }
      is_provider_reviewer: { Args: never; Returns: boolean }
      is_verified_veterinarian: { Args: { uid: string }; Returns: boolean }
      owns_provider_workspace: {
        Args: { provider_uuid: string }
        Returns: boolean
      }
      provider_publication_eligible: {
        Args: { provider_uuid: string }
        Returns: boolean
      }
      register_provider_evidence: {
        Args: {
          expiry?: string
          kind: string
          object_path: string
          provider_uuid: string
        }
        Returns: string
      }
      review_provider_verification: {
        Args: {
          decision: string
          expected_revision: number
          owner_feedback?: string
          provider_uuid: string
        }
        Returns: string
      }
      save_provider_draft: {
        Args: { input: Json; provider_uuid?: string }
        Returns: string
      }
      save_provider_service: {
        Args: {
          expected_version?: number
          input: Json
          provider_uuid: string
          service_uuid?: string
        }
        Returns: string
      }
      set_provider_service_publication: {
        Args: {
          expected_version: number
          publish: boolean
          service_uuid: string
        }
        Returns: string
      }
      submit_provider_verification: {
        Args: { provider_uuid: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "pet_owner" | "veterinarian" | "service_provider" | "admin"
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      consultation_status:
        | "pending"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
      service_category:
        | "grooming"
        | "pet_sitting"
        | "training"
        | "vet_clinic"
        | "vet_store"
        | "boarding"
        | "transportation"
        | "other"
      species_type:
        | "dog"
        | "cat"
        | "bird"
        | "rabbit"
        | "fish"
        | "cattle"
        | "goat"
        | "sheep"
        | "poultry"
        | "pig"
        | "horse"
        | "other"
      vendor_status:
        | "pending"
        | "approved"
        | "rejected"
        | "suspended"
        | "inactive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["pet_owner", "veterinarian", "service_provider", "admin"],
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      consultation_status: [
        "pending",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
      service_category: [
        "grooming",
        "pet_sitting",
        "training",
        "vet_clinic",
        "vet_store",
        "boarding",
        "transportation",
        "other",
      ],
      species_type: [
        "dog",
        "cat",
        "bird",
        "rabbit",
        "fish",
        "cattle",
        "goat",
        "sheep",
        "poultry",
        "pig",
        "horse",
        "other",
      ],
      vendor_status: [
        "pending",
        "approved",
        "rejected",
        "suspended",
        "inactive",
      ],
    },
  },
} as const
