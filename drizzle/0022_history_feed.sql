CREATE OR REPLACE FUNCTION public.history_feed(
  target_sheet_id uuid,
  target_year integer,
  target_month integer,
  target_type public.transaction_type DEFAULT NULL,
  target_category_id uuid DEFAULT NULL
)
RETURNS TABLE (
  transaction_id uuid,
  amount numeric,
  transaction_type public.transaction_type,
  description text,
  transaction_date date,
  category_id uuid,
  category_name text,
  category_type public.transaction_type,
  category_icon text,
  payment_type_name text,
  payment_type_icon text,
  created_by uuid,
  creator_display_name text,
  creator_email text,
  creator_avatar_url text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    t.id AS transaction_id,
    t.amount,
    t.type AS transaction_type,
    t.description,
    t.date AS transaction_date,
    c.id AS category_id,
    c.name AS category_name,
    c.type AS category_type,
    c.icon AS category_icon,
    pt.name AS payment_type_name,
    pt.icon AS payment_type_icon,
    t.created_by,
    smd.display_name AS creator_display_name,
    smd.email AS creator_email,
    smd.avatar_url AS creator_avatar_url
  FROM public.transactions t
  INNER JOIN public.categories c
    ON c.id = t.category_id
  LEFT JOIN public.payment_types pt
    ON pt.id = t.payment_type_id
  LEFT JOIN public.sheet_member_directory smd
    ON smd.sheet_id = t.sheet_id
   AND smd.member_id = t.created_by
  WHERE t.sheet_id = target_sheet_id
    AND EXTRACT(YEAR FROM t.date)::integer = target_year
    AND (EXTRACT(MONTH FROM t.date)::integer - 1) = target_month
    AND (target_type IS NULL OR t.type = target_type)
    AND (target_category_id IS NULL OR t.category_id = target_category_id)
  ORDER BY t.date DESC, t.created_at DESC;
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.history_feed(uuid, integer, integer, public.transaction_type, uuid) TO authenticated;
