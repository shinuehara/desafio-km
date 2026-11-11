ALTER TABLE "activities" ALTER COLUMN "photo_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "photos_deleted_at" timestamp with time zone;