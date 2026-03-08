DROP TABLE IF EXISTS "sync_operations";
--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "updated_at";
