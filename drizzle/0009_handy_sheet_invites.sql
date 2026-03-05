CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'declined', 'revoked', 'expired');--> statement-breakpoint
CREATE TABLE "sheet_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"invited_email" text NOT NULL,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"token_hash" text NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"invited_by" uuid NOT NULL,
	"accepted_by" uuid,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sheet_invites" ADD CONSTRAINT "sheet_invites_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_users" ADD CONSTRAINT "sheet_users_sheet_id_user_id_uq" UNIQUE("sheet_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sheet_invites_token_hash_uq" ON "sheet_invites" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sheet_invites_sheet_email_status_idx" ON "sheet_invites" USING btree ("sheet_id","invited_email","status");--> statement-breakpoint
CREATE INDEX "sheet_invites_email_status_expires_idx" ON "sheet_invites" USING btree ("invited_email","status","expires_at");
