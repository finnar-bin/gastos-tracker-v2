DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sheets'
      AND policyname = 'sheets_select_for_members'
  ) THEN
    DROP POLICY "sheets_select_for_members" ON "public"."sheets";
  END IF;
END $$;
--> statement-breakpoint
CREATE POLICY "sheets_select_for_members"
  ON "public"."sheets"
  FOR SELECT
  TO authenticated
  USING (public.is_sheet_member(id));
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sheet_users'
      AND policyname = 'sheet_users_select_for_members'
  ) THEN
    DROP POLICY "sheet_users_select_for_members" ON "public"."sheet_users";
  END IF;
END $$;
--> statement-breakpoint
CREATE POLICY "sheet_users_select_for_members"
  ON "public"."sheet_users"
  FOR SELECT
  TO authenticated
  USING (public.is_sheet_member(sheet_id));
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sheet_settings'
      AND policyname = 'sheet_settings_select_for_members'
  ) THEN
    DROP POLICY "sheet_settings_select_for_members" ON "public"."sheet_settings";
  END IF;
END $$;
--> statement-breakpoint
CREATE POLICY "sheet_settings_select_for_members"
  ON "public"."sheet_settings"
  FOR SELECT
  TO authenticated
  USING (public.is_sheet_member(sheet_id));
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'categories'
      AND policyname = 'categories_select_for_members'
  ) THEN
    DROP POLICY "categories_select_for_members" ON "public"."categories";
  END IF;
END $$;
--> statement-breakpoint
CREATE POLICY "categories_select_for_members"
  ON "public"."categories"
  FOR SELECT
  TO authenticated
  USING (public.is_sheet_member(sheet_id));
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_types'
      AND policyname = 'payment_types_select_for_members'
  ) THEN
    DROP POLICY "payment_types_select_for_members" ON "public"."payment_types";
  END IF;
END $$;
--> statement-breakpoint
CREATE POLICY "payment_types_select_for_members"
  ON "public"."payment_types"
  FOR SELECT
  TO authenticated
  USING (public.is_sheet_member(sheet_id));
