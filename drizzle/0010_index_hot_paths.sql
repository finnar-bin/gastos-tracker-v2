CREATE INDEX "profiles_email_idx" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "sheet_users_user_id_idx" ON "sheet_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sheet_invites_sheet_status_expires_idx" ON "sheet_invites" USING btree ("sheet_id","status","expires_at");--> statement-breakpoint
CREATE INDEX "categories_sheet_created_at_idx" ON "categories" USING btree ("sheet_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_types_sheet_id_idx" ON "payment_types" USING btree ("sheet_id");--> statement-breakpoint
CREATE INDEX "recurring_transactions_sheet_created_at_idx" ON "recurring_transactions" USING btree ("sheet_id","created_at");--> statement-breakpoint
CREATE INDEX "recurring_transactions_active_due_date_idx" ON "recurring_transactions" USING btree ("next_process_date") WHERE "is_active" = true;
