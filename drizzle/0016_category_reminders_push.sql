CREATE TYPE "public"."category_due_reminder_frequency" AS ENUM('specific_date', 'daily', 'weekly', 'monthly');
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "time_zone" text;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "push_notifications_enabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "due_reminder_frequency" "category_due_reminder_frequency";
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "due_last_notified_on" date;
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh_key" text NOT NULL,
	"auth_key" text NOT NULL,
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_endpoint_uq" ON "push_subscriptions" USING btree ("endpoint");
--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_active_idx" ON "push_subscriptions" USING btree ("user_id","is_active");
--> statement-breakpoint
CREATE TABLE "category_reminder_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"local_date" date NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category_reminder_deliveries" ADD CONSTRAINT "category_reminder_deliveries_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "category_reminder_deliveries_user_category_date_uq" ON "category_reminder_deliveries" USING btree ("user_id","category_id","local_date");
--> statement-breakpoint
CREATE INDEX "category_reminder_deliveries_user_date_idx" ON "category_reminder_deliveries" USING btree ("user_id","local_date");
