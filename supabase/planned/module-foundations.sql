-- Local blueprint only. NOT a main-project migration or authorization to enable features.
-- Historical phase 10 assumes this catalogue but never creates it.
CREATE TABLE public.products (
 id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), name text NOT NULL, description text,
 category text NOT NULL, price numeric(10,2) NOT NULL CHECK(price>=0),
 stock integer NOT NULL DEFAULT 0 CHECK(stock>=0), image_url text,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- Advanced bookings target provider_services; legacy listing_id cannot be mandatory.
ALTER TABLE public.bookings ALTER COLUMN listing_id DROP NOT NULL;
ALTER TABLE public.bookings ADD COLUMN total_amount numeric(10,2) NOT NULL DEFAULT 0;
-- The historical status enum is incompatible with new phase-17 LIKE reporting.
-- A future rollout must constrain the expanded lifecycle explicitly before enabling writes.
ALTER TABLE public.bookings ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.bookings ALTER COLUMN status TYPE text USING status::text;
ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'pending';
