-- Add analytics fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Nigeria',
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vendor_type TEXT, -- For service_providers: 'groomer', 'pharmacy', 'store', 'feed_supplier', 'consultant', etc.
ADD COLUMN IF NOT EXISTS customer_type TEXT; -- For pet_owners: 'pet_owner', 'farm_owner', 'livestock_owner'

-- Update existing profiles with some default vendor types based on specialty if possible
UPDATE public.profiles
SET vendor_type = lower(specialty)
WHERE specialty IS NOT NULL AND vendor_type IS NULL;

-- Create a view for easy analytics if needed, but we'll use direct queries for now.
