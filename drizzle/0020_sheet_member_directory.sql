CREATE VIEW public.sheet_member_directory
WITH (security_invoker = true) AS
SELECT
  su.sheet_id,
  su.user_id AS member_id,
  su.role,
  p.display_name,
  p.avatar_url,
  p.email
FROM public.sheet_users su
LEFT JOIN public.profiles p
  ON p.id = su.user_id;
--> statement-breakpoint
GRANT SELECT ON public.sheet_member_directory TO authenticated;
