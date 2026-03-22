CREATE OR REPLACE FUNCTION public.category_transactions(
  target_sheet_id uuid,
  target_category_id uuid,
  target_year integer,
  target_month integer
)
RETURNS TABLE (
  transaction_id uuid,
  amount numeric,
  transaction_type public.transaction_type,
  description text,
  transaction_date date,
  payment_type_name text,
  payment_type_icon text,
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
    pt.name AS payment_type_name,
    pt.icon AS payment_type_icon,
    smd.display_name AS creator_display_name,
    smd.email AS creator_email,
    smd.avatar_url AS creator_avatar_url
  FROM public.transactions t
  LEFT JOIN public.payment_types pt
    ON pt.id = t.payment_type_id
  LEFT JOIN public.sheet_member_directory smd
    ON smd.sheet_id = t.sheet_id
   AND smd.member_id = t.created_by
  WHERE t.sheet_id = target_sheet_id
    AND t.category_id = target_category_id
    AND EXTRACT(YEAR FROM t.date)::integer = target_year
    AND (EXTRACT(MONTH FROM t.date)::integer - 1) = target_month
  ORDER BY t.date DESC, t.created_at DESC;
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.category_transactions(uuid, uuid, integer, integer) TO authenticated;
