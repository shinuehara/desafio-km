CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_id" integer NOT NULL,
	"distance_m" integer NOT NULL,
	"activity_date" date NOT NULL,
	"photo_key" text NOT NULL,
	"invalidated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"goals" integer[] DEFAULT '{42,100}' NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"kit_description" text DEFAULT 'Camiseta + medalha' NOT NULL,
	"pix_key" text DEFAULT '' NOT NULL,
	"pix_name" text DEFAULT '' NOT NULL,
	"pix_city" text DEFAULT '' NOT NULL,
	"organizer_name" text DEFAULT '' NOT NULL,
	"organizer_whatsapp" text DEFAULT '' NOT NULL,
	"regulation_key" text,
	"regulation_name" text,
	"kit_image_key" text,
	"registration_open" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "challenges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"team_id" integer,
	"token" text NOT NULL,
	"name" text NOT NULL,
	"whatsapp" text NOT NULL,
	"shirt_size" text NOT NULL,
	"cep" text NOT NULL,
	"street" text NOT NULL,
	"number" text NOT NULL,
	"complement" text DEFAULT '' NOT NULL,
	"neighborhood" text DEFAULT '' NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"goal_km" integer NOT NULL,
	"paid_at" timestamp with time zone,
	"kit_sent_at" timestamp with time zone,
	"accepted_rules_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participants_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_participant" ON "activities" USING btree ("participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_challenge_whatsapp" ON "participants" USING btree ("challenge_id","whatsapp");--> statement-breakpoint
CREATE INDEX "participants_challenge" ON "participants" USING btree ("challenge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_challenge_slug" ON "teams" USING btree ("challenge_id","slug");