DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_select_own'
  ) THEN
    DROP POLICY "profiles_select_own" ON "public"."profiles";
  END IF;
END $$;
--> statement-breakpoint
CREATE POLICY "profiles_select_for_sheet_members"
  ON "public"."profiles"
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.sheet_users su_self
      INNER JOIN public.sheet_users su_target
        ON su_target.sheet_id = su_self.sheet_id
      WHERE su_self.user_id = auth.uid()
        AND su_target.user_id = profiles.id
    )
  );
