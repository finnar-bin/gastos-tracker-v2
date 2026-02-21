CREATE TABLE "payment_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"sheet_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" RENAME COLUMN "user_id" TO "created_by";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "budget" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "default_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_type_id" uuid;--> statement-breakpoint
ALTER TABLE "payment_types" ADD CONSTRAINT "payment_types_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_type_id_payment_types_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."payment_types"("id") ON DELETE set null ON UPDATE no action;