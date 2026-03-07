-- Create vet_presence table for tracking online status
CREATE TABLE IF NOT EXISTS public.vet_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_online boolean DEFAULT false,
  last_seen_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on vet_presence
ALTER TABLE public.vet_presence ENABLE ROW LEVEL SECURITY;

-- Anyone can view vet presence (for showing online vets count)
CREATE POLICY "Anyone can view vet presence"
ON public.vet_presence
FOR SELECT
USING (true);

-- Vets can insert their own presence
CREATE POLICY "Users can insert own presence"
ON public.vet_presence
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Vets can update their own presence
CREATE POLICY "Users can update own presence"
ON public.vet_presence
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM messages m
  JOIN consultations c ON m.consultation_id = c.id
  WHERE m.is_read = false 
  AND m.sender_id != get_profile_id(p_user_id)
  AND (c.pet_owner_id = get_profile_id(p_user_id) OR c.veterinarian_id = get_profile_id(p_user_id));
$$;

-- Function to get online vets count
CREATE OR REPLACE FUNCTION public.get_online_vets_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM profiles p
  JOIN user_roles ur ON p.user_id = ur.user_id
  WHERE ur.role = 'veterinarian'
  AND p.is_available = true
  AND p.license_verified = true;
$$;

-- Trigger to update updated_at on vet_presence
CREATE TRIGGER update_vet_presence_updated_at
BEFORE UPDATE ON public.vet_presence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();