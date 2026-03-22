CREATE VIEW public.recurring_overview
WITH (security_invoker = true) AS
SELECT
  rt.sheet_id,
  rt.id,
  rt.amount,
  rt.type,
  rt.description,
  rt.frequency,
  rt.next_process_date,
  rt.is_active,
  rt.created_at,
  c.id AS category_id,
  c.name AS category_name,
  c.icon AS category_icon,
  pt.id AS payment_type_id,
  pt.name AS payment_type_name
FROM public.recurring_transactions rt
INNER JOIN public.categories c
  ON c.id = rt.category_id
LEFT JOIN public.payment_types pt
  ON pt.id = rt.payment_type_id;
--> statement-breakpoint
GRANT SELECT ON public.recurring_overview TO authenticated;
