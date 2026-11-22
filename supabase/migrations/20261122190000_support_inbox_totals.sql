CREATE FUNCTION public.support_inbox_totals()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM support_inbox_assert_admin();

  RETURN (
    SELECT jsonb_build_object(
      'open', count(*) FILTER (WHERE resolved_at IS NULL),
      'unread', count(*) FILTER (WHERE NOT is_read),
      'resolved', count(*) FILTER (WHERE resolved_at IS NOT NULL)
    )
    FROM contact_messages
  );
END $$;

REVOKE ALL ON FUNCTION public.support_inbox_totals() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.support_inbox_totals() TO authenticated;
