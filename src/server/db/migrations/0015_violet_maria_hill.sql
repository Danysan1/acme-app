CREATE TYPE "public"."card_column" AS ENUM('well', 'improve', 'questions');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('waiting', 'collecting', 'discussing', 'actions', 'closed');--> statement-breakpoint
CREATE TABLE "acme_retro_action_item" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"session_id" uuid NOT NULL,
	"title" varchar(512) NOT NULL,
	"owner_name" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acme_retro_feedback_card" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"session_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"column" "card_column" NOT NULL,
	"text" text NOT NULL,
	"vote_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acme_retro_participant" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"session_id" uuid NOT NULL,
	"display_name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"submitted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acme_retro_session" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"code" varchar(6) NOT NULL,
	"sprint_name" varchar(256) NOT NULL,
	"facilitator_token" varchar(64) NOT NULL,
	"status" "session_status" DEFAULT 'waiting' NOT NULL,
	CONSTRAINT "acme_retro_session_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "acme_retro_action_item" ADD CONSTRAINT "acme_retro_action_item_session_id_acme_retro_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."acme_retro_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acme_retro_feedback_card" ADD CONSTRAINT "acme_retro_feedback_card_session_id_acme_retro_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."acme_retro_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acme_retro_feedback_card" ADD CONSTRAINT "acme_retro_feedback_card_participant_id_acme_retro_participant_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."acme_retro_participant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acme_retro_participant" ADD CONSTRAINT "acme_retro_participant_session_id_acme_retro_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."acme_retro_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "retro_action_session_idx" ON "acme_retro_action_item" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "retro_card_session_idx" ON "acme_retro_feedback_card" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "retro_participant_session_idx" ON "acme_retro_participant" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "retro_session_code_idx" ON "acme_retro_session" USING btree ("code");