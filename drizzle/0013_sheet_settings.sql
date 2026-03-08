CREATE TABLE "sheet_settings" (
	"sheet_id" uuid PRIMARY KEY NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sheet_settings" ADD CONSTRAINT "sheet_settings_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id") ON DELETE cascade ON UPDATE no action;
