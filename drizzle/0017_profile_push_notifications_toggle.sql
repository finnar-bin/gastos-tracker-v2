ALTER TABLE "profiles"
ADD COLUMN IF NOT EXISTS "push_notifications_enabled" boolean DEFAULT true NOT NULL;
