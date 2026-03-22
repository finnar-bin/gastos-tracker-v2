CREATE OR REPLACE FUNCTION public.dashboard_summary(
  target_sheet_id uuid,
  target_year integer,
  target_month integer
)
RETURNS TABLE (
  income_total numeric,
  expense_total numeric,
  chart_data jsonb,
  recent_transactions jsonb
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH month_totals AS (
    SELECT
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::numeric AS income_total,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::numeric AS expense_total
    FROM public.transactions t
    WHERE t.sheet_id = target_sheet_id
      AND EXTRACT(YEAR FROM t.date)::integer = target_year
      AND (EXTRACT(MONTH FROM t.date)::integer - 1) = target_month
  ),
  year_series AS (
    SELECT
      month_index,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::numeric AS income,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::numeric AS expense
    FROM generate_series(0, 11) AS month_index
    LEFT JOIN public.transactions t
      ON t.sheet_id = target_sheet_id
     AND EXTRACT(YEAR FROM t.date)::integer = target_year
     AND (EXTRACT(MONTH FROM t.date)::integer - 1) = month_index
    GROUP BY month_index
    ORDER BY month_index
  ),
  recent_rows AS (
    SELECT
      t.id,
      t.amount,
      t.type,
      t.description,
      t.date,
      c.name AS category_name,
      c.icon AS category_icon,
      smd.display_name AS creator_display_name,
      smd.email AS creator_email,
      smd.avatar_url AS creator_avatar_url
    FROM public.transactions t
    INNER JOIN public.categories c
      ON c.id = t.category_id
    LEFT JOIN public.sheet_member_directory smd
      ON smd.sheet_id = t.sheet_id
     AND smd.member_id = t.created_by
    WHERE t.sheet_id = target_sheet_id
    ORDER BY t.created_at DESC
    LIMIT 5
  )
  SELECT
    mt.income_total,
    mt.expense_total,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'month', ys.month_index,
            'income', ys.income,
            'expense', ys.expense
          )
          ORDER BY ys.month_index
        )
        FROM year_series ys
      ),
      '[]'::jsonb
    ) AS chart_data,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', rr.id,
            'amount', rr.amount,
            'type', rr.type,
            'description', rr.description,
            'date', rr.date,
            'categoryName', rr.category_name,
            'categoryIcon', rr.category_icon,
            'creatorDisplayName', rr.creator_display_name,
            'creatorEmail', rr.creator_email,
            'creatorAvatarUrl', rr.creator_avatar_url
          )
          ORDER BY rr.date DESC, rr.id DESC
        )
        FROM recent_rows rr
      ),
      '[]'::jsonb
    ) AS recent_transactions
  FROM month_totals mt;
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.dashboard_summary(uuid, integer, integer) TO authenticated;
