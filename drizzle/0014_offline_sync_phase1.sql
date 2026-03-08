ALTER TABLE "transactions"
ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sheet_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"operation_type" text NOT NULL,
	"client_mutation_id" uuid NOT NULL,
	"entity_id" uuid,
	"status" text DEFAULT 'applied' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sync_operations_sheet_id_sheets_id_fk'
      AND conrelid = 'public.sync_operations'::regclass
  ) THEN
    ALTER TABLE "sync_operations"
    ADD CONSTRAINT "sync_operations_sheet_id_sheets_id_fk"
    FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id")
    ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sync_ops_user_mutation_uq"
ON "sync_operations" USING btree ("user_id","client_mutation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_ops_user_created_at_idx"
ON "sync_operations" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_ops_sheet_created_at_idx"
ON "sync_operations" USING btree ("sheet_id","created_at");
