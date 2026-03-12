CREATE OR REPLACE FUNCTION public.is_sheet_member(target_sheet_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sheet_users
    WHERE sheet_users.sheet_id = target_sheet_id
      AND sheet_users.user_id = auth.uid()
  );
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.is_sheet_member(uuid) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.is_sheet_member(uuid) TO authenticated;
--> statement-breakpoint
ALTER TABLE "sheets" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sheets" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sheet_users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sheet_users" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sheet_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sheet_settings" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "categories" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "payment_types" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "payment_types" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sheets'
      AND policyname = 'sheets_select_for_members'
  ) THEN
    CREATE POLICY "sheets_select_for_members"
      ON "public"."sheets"
      FOR SELECT
      TO authenticated
      USING (public.is_sheet_member(id));
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sheet_users'
      AND policyname = 'sheet_users_select_for_members'
  ) THEN
    CREATE POLICY "sheet_users_select_for_members"
      ON "public"."sheet_users"
      FOR SELECT
      TO authenticated
      USING (public.is_sheet_member(sheet_id));
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sheet_settings'
      AND policyname = 'sheet_settings_select_for_members'
  ) THEN
    CREATE POLICY "sheet_settings_select_for_members"
      ON "public"."sheet_settings"
      FOR SELECT
      TO authenticated
      USING (public.is_sheet_member(sheet_id));
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'categories'
      AND policyname = 'categories_select_for_members'
  ) THEN
    CREATE POLICY "categories_select_for_members"
      ON "public"."categories"
      FOR SELECT
      TO authenticated
      USING (public.is_sheet_member(sheet_id));
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_types'
      AND policyname = 'payment_types_select_for_members'
  ) THEN
    CREATE POLICY "payment_types_select_for_members"
      ON "public"."payment_types"
      FOR SELECT
      TO authenticated
      USING (public.is_sheet_member(sheet_id));
  END IF;
END $$;
