CREATE OR REPLACE FUNCTION public.transaction_overview(
  target_sheet_id uuid,
  target_year integer,
  target_month integer,
  target_type public.transaction_type
)
RETURNS TABLE (
  category_id uuid,
  category_name text,
  category_icon text,
  category_type public.transaction_type,
  budget numeric,
  total_amount numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH category_totals AS (
    SELECT
      t.category_id,
      COALESCE(SUM(t.amount), 0)::numeric AS total_amount
    FROM public.transactions t
    WHERE t.sheet_id = target_sheet_id
      AND t.type = target_type
      AND EXTRACT(YEAR FROM t.date)::integer = target_year
      AND (EXTRACT(MONTH FROM t.date)::integer - 1) = target_month
    GROUP BY t.category_id
  )
  SELECT
    c.id AS category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    c.type AS category_type,
    c.budget,
    COALESCE(ct.total_amount, 0)::numeric AS total_amount
  FROM public.categories c
  LEFT JOIN category_totals ct
    ON ct.category_id = c.id
  WHERE c.sheet_id = target_sheet_id
    AND c.type = target_type
  ORDER BY c.name ASC;
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.transaction_overview(uuid, integer, integer, public.transaction_type) TO authenticated;
