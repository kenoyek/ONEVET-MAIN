-- Enable realtime for vet_presence table only (messages already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.vet_presence;