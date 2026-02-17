ALTER TABLE "transactions" ALTER COLUMN "date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "date" SET DEFAULT now();