


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."booking_agreements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "accepted_name" "text" NOT NULL,
    "accepted_email" "text",
    "payment_plan" "text" NOT NULL,
    "agreed_price" numeric(12,2) NOT NULL,
    "terms_version" "text" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    CONSTRAINT "booking_agreements_payment_plan_check" CHECK (("payment_plan" = ANY (ARRAY['cash'::"text", 'prepay'::"text"])))
);


ALTER TABLE "public"."booking_agreements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "kind" "text" DEFAULT 'service'::"text" NOT NULL,
    "artist_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "booking_items_kind_check" CHECK (("kind" = ANY (ARRAY['artist'::"text", 'service'::"text"])))
);


ALTER TABLE "public"."booking_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "direction" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "description" "text",
    "paid_at" timestamp with time zone,
    CONSTRAINT "booking_payments_direction_check" CHECK (("direction" = ANY (ARRAY['inbound'::"text", 'outbound'::"text"]))),
    CONSTRAINT "booking_payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'refunded'::"text"]))),
    CONSTRAINT "booking_payments_type_check" CHECK (("type" = ANY (ARRAY['deposit'::"text", 'full'::"text", 'advance'::"text", 'artist_payment'::"text", 'refund'::"text"])))
);


ALTER TABLE "public"."booking_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "inquiry_id" "uuid",
    "artist_id" "uuid",
    "client_name" "text" NOT NULL,
    "client_email" "text",
    "client_phone" "text",
    "event_type" "text",
    "event_date" "date",
    "event_time" "text",
    "event_duration_hours" numeric(4,1),
    "venue_name" "text",
    "venue_city" "text",
    "venue_address" "text",
    "fee" numeric(12,2) DEFAULT 0 NOT NULL,
    "commission_rate" numeric(5,2) DEFAULT 15 NOT NULL,
    "deposit_rate" numeric(5,2) DEFAULT 30 NOT NULL,
    "travel_required" boolean DEFAULT false NOT NULL,
    "accommodation_required" boolean DEFAULT false NOT NULL,
    "advance_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "contract_url" "text",
    "contract_signed_at" timestamp with time zone,
    "report_url" "text",
    "delivery_slug" "text",
    "delivery_photos" "jsonb" DEFAULT '[]'::"jsonb",
    "delivery_videos" "jsonb" DEFAULT '[]'::"jsonb",
    "delivery_notes" "text",
    "delivery_sent_at" timestamp with time zone,
    "notes" "text",
    "internal_notes" "text",
    "offer_slug" "text",
    "payment_plan" "text",
    "checklist_token" "text",
    "prepay_markup_rate" numeric(5,2) DEFAULT 25 NOT NULL,
    CONSTRAINT "bookings_payment_plan_check" CHECK (("payment_plan" = ANY (ARRAY['cash'::"text", 'prepay'::"text"]))),
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'offer_sent'::"text", 'confirmed'::"text", 'contracted'::"text", 'deposit_paid'::"text", 'full_paid'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checklist_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "booking_id" "uuid",
    "author_type" "text" NOT NULL,
    "author_name" "text",
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_project_id" "uuid"
);


ALTER TABLE "public"."checklist_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checklist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "category" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "is_done" boolean DEFAULT false NOT NULL,
    "done_by" "text",
    "done_at" timestamp with time zone,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_project_id" "uuid",
    "assigned_to" "text",
    "due_date" "date"
);


ALTER TABLE "public"."checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "year" integer NOT NULL,
    "metric" "text" NOT NULL,
    "label" "text",
    "target" numeric NOT NULL,
    "manual_actual" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."company_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_task_completions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "period" "text" NOT NULL,
    "done_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."company_task_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" DEFAULT 'diger'::"text" NOT NULL,
    "recurrence" "text" DEFAULT 'once'::"text" NOT NULL,
    "due_date" "date",
    "assigned_to" "text",
    "is_done" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."company_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."concepts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "emoji" "text",
    "category" "text" NOT NULL,
    "description" "text",
    "atmosphere" "text"[] DEFAULT '{}'::"text"[],
    "musical_direction" "text"[] DEFAULT '{}'::"text"[],
    "cover_image_url" "text",
    "color" "text" DEFAULT 'bg-secondary'::"text",
    "is_dark" boolean DEFAULT false,
    "is_signature" boolean DEFAULT false,
    "energy_level" integer DEFAULT 5,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "spotify_playlist_url" "text",
    CONSTRAINT "concepts_category_check" CHECK (("category" = ANY (ARRAY['cocktail'::"text", 'celebration'::"text", 'traditional'::"text", 'after-party'::"text"])))
);


ALTER TABLE "public"."concepts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "event_type" "text",
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contact_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dj_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "clerk_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "bio" "text",
    "photo_url" "text",
    "soundcloud_url" "text",
    "mixcloud_url" "text",
    "youtube_url" "text",
    "concept_tags" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true,
    "busy_dates" "date"[] DEFAULT '{}'::"date"[],
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "focal_points" "jsonb" DEFAULT '{}'::"jsonb",
    "performer_type" "text" DEFAULT 'dj'::"text" NOT NULL,
    "application_status" "text" DEFAULT 'approved'::"text" NOT NULL,
    "instagram_url" "text",
    "spotify_url" "text",
    "website_url" "text",
    "city" "text",
    "speciality" "text",
    "email" "text",
    "phone" "text",
    "repertoire" "text",
    "event_types" "text"[] DEFAULT '{}'::"text"[],
    "youtube_links" "text"[] DEFAULT '{}'::"text"[],
    "cover_cities" "text"[] DEFAULT '{}'::"text"[],
    "preview_video_url" "text",
    "videos" "text"[] DEFAULT '{}'::"text"[],
    "referral_source" "text",
    "slug" "text",
    "rider_url" "text",
    "rider" "jsonb" DEFAULT '[]'::"jsonb",
    "media_drive_url" "text",
    "base_fee_min" numeric(12,2),
    "base_fee_max" numeric(12,2),
    "event_type_fees" "jsonb" DEFAULT '{}'::"jsonb",
    "sort_order" integer DEFAULT 1000000 NOT NULL
);


ALTER TABLE "public"."dj_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_ai_outputs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_project_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."event_ai_outputs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "client_name" "text" NOT NULL,
    "client_email" "text",
    "client_phone" "text",
    "event_type" "text",
    "event_date" "date",
    "event_time" "text",
    "guest_count" integer,
    "venue_name" "text",
    "venue_city" "text",
    "venue_address" "text",
    "budget" numeric,
    "decisions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'planning'::"text" NOT NULL,
    "checklist_token" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."event_projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_schedule_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_project_id" "uuid" NOT NULL,
    "time" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "assigned_to" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."event_schedule_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inquiries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "event_type" "text" NOT NULL,
    "event_date" "text",
    "guest_type" "text",
    "event_sections" "jsonb" DEFAULT '{}'::"jsonb",
    "moment_selections" "jsonb" DEFAULT '{}'::"jsonb",
    "services" "text"[] DEFAULT '{}'::"text"[],
    "contact" "jsonb" DEFAULT '{}'::"jsonb",
    "assigned_partners" "text"[] DEFAULT '{}'::"text"[],
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "admin_notes" "text",
    "assigned_dj_id" "uuid",
    CONSTRAINT "inquiries_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'confirmed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."inquiries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "template" "text" DEFAULT 'modern'::"text" NOT NULL,
    "bride_name" "text" NOT NULL,
    "groom_name" "text" NOT NULL,
    "wedding_date" "date",
    "wedding_time" "text",
    "venue_name" "text",
    "venue_address" "text",
    "venue_maps_url" "text",
    "story" "text",
    "cover_photo_url" "text",
    "music_note" "text",
    "dress_code" "text",
    "rsvp_deadline" "date",
    "rsvp_enabled" boolean DEFAULT true NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "seating_plan_url" "text",
    "seating_tables" "jsonb",
    "memory_drive_url" "text"
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journal_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "category" "text",
    "excerpt" "text",
    "content" "text",
    "cover_image_url" "text",
    "color" "text" DEFAULT 'bg-secondary'::"text",
    "read_time" "text",
    "is_featured" boolean DEFAULT false,
    "is_published" boolean DEFAULT false,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."journal_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memory_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "invitation_id" "uuid",
    "password" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "gallery_visibility" "text" DEFAULT 'guests'::"text" NOT NULL,
    "gallery_token" "text"
);


ALTER TABLE "public"."memory_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memory_uploads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_type" "text" DEFAULT 'image'::"text" NOT NULL,
    "file_name" "text",
    "file_size" bigint,
    "uploader_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."memory_uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "tag" "text",
    "emoji" "text" DEFAULT '📦'::"text",
    "description" "text",
    "includes" "jsonb" DEFAULT '[]'::"jsonb",
    "suitable" "jsonb" DEFAULT '[]'::"jsonb",
    "price_from" numeric(12,2),
    "price_note" "text",
    "cta_text" "text" DEFAULT 'Teklif Al'::"text",
    "cta_href" "text" DEFAULT '/planla'::"text",
    "color" "text" DEFAULT 'bg-background'::"text",
    "is_dark" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "clerk_id" "text",
    "company_name" "text",
    "description" "text",
    "logo_url" "text",
    "contact_email" "text",
    "contact_phone" "text",
    "service_category" "text",
    "services" "jsonb" DEFAULT '[]'::"jsonb",
    "portfolio_images" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true,
    "focal_points" "jsonb" DEFAULT '{}'::"jsonb",
    "application_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "cover_cities" "text"[] DEFAULT '{}'::"text"[],
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "category" "text"[] DEFAULT '{}'::"text"[],
    "instagram_url" "text",
    "website_url" "text",
    "contact_name" "text",
    "business_name" "text",
    "city" "text",
    "email" "text",
    "phone" "text",
    "event_types" "text"[] DEFAULT '{}'::"text"[],
    "videos" "text"[] DEFAULT '{}'::"text"[],
    "preview_video_url" "text",
    "referral_source" "text"
);


ALTER TABLE "public"."partner_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_factors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "factor" "text" NOT NULL,
    "impact" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."pricing_factors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_faq" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."pricing_faq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_tiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" NOT NULL,
    "emoji" "text" DEFAULT '🎵'::"text",
    "range_text" "text" NOT NULL,
    "description" "text",
    "includes" "jsonb" DEFAULT '[]'::"jsonb",
    "suitable" "jsonb" DEFAULT '[]'::"jsonb",
    "is_featured" boolean DEFAULT false,
    "is_dark" boolean DEFAULT false,
    "color" "text" DEFAULT 'bg-background'::"text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pricing_tiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rsvp_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invitation_id" "uuid" NOT NULL,
    "guest_name" "text" NOT NULL,
    "guest_count" integer DEFAULT 1 NOT NULL,
    "attending" boolean NOT NULL,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "guest_email" "text"
);


ALTER TABLE "public"."rsvp_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "category" "text" NOT NULL,
    "label" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "public_url" "text" NOT NULL,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."site_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."songs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "title" "text" NOT NULL,
    "artist" "text" NOT NULL,
    "event_moment" "text" NOT NULL,
    "category" "text" NOT NULL,
    "language" "text" DEFAULT 'tr'::"text" NOT NULL,
    "energy" "text" DEFAULT 'slow'::"text" NOT NULL,
    "mood_tags" "text"[] DEFAULT '{}'::"text"[],
    "spotify_url" "text",
    "youtube_url" "text",
    "audio_file_url" "text",
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."songs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."testimonials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote" "text" NOT NULL,
    "name" "text" NOT NULL,
    "event" "text",
    "initials" "text",
    "color" "text" DEFAULT 'bg-[oklch(0.88_0.055_65)]'::"text",
    "dark" boolean DEFAULT false,
    "rating" integer DEFAULT 5,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "testimonials_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."testimonials" OWNER TO "postgres";


ALTER TABLE ONLY "public"."booking_agreements"
    ADD CONSTRAINT "booking_agreements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_items"
    ADD CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_payments"
    ADD CONSTRAINT "booking_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_checklist_token_key" UNIQUE ("checklist_token");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_delivery_slug_key" UNIQUE ("delivery_slug");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_offer_slug_key" UNIQUE ("offer_slug");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checklist_comments"
    ADD CONSTRAINT "checklist_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checklist_items"
    ADD CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_goals"
    ADD CONSTRAINT "company_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_task_completions"
    ADD CONSTRAINT "company_task_completions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_task_completions"
    ADD CONSTRAINT "company_task_completions_task_id_period_key" UNIQUE ("task_id", "period");



ALTER TABLE ONLY "public"."company_tasks"
    ADD CONSTRAINT "company_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."concepts"
    ADD CONSTRAINT "concepts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."concepts"
    ADD CONSTRAINT "concepts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."contact_messages"
    ADD CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dj_profiles"
    ADD CONSTRAINT "dj_profiles_clerk_id_key" UNIQUE ("clerk_id");



ALTER TABLE ONLY "public"."dj_profiles"
    ADD CONSTRAINT "dj_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dj_profiles"
    ADD CONSTRAINT "dj_profiles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."event_ai_outputs"
    ADD CONSTRAINT "event_ai_outputs_event_project_id_type_key" UNIQUE ("event_project_id", "type");



ALTER TABLE ONLY "public"."event_ai_outputs"
    ADD CONSTRAINT "event_ai_outputs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_projects"
    ADD CONSTRAINT "event_projects_checklist_token_key" UNIQUE ("checklist_token");



ALTER TABLE ONLY "public"."event_projects"
    ADD CONSTRAINT "event_projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_schedule_items"
    ADD CONSTRAINT "event_schedule_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."journal_posts"
    ADD CONSTRAINT "journal_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journal_posts"
    ADD CONSTRAINT "journal_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."memory_events"
    ADD CONSTRAINT "memory_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memory_events"
    ADD CONSTRAINT "memory_events_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."memory_uploads"
    ADD CONSTRAINT "memory_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."partner_profiles"
    ADD CONSTRAINT "partner_profiles_clerk_id_key" UNIQUE ("clerk_id");



ALTER TABLE ONLY "public"."partner_profiles"
    ADD CONSTRAINT "partner_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_factors"
    ADD CONSTRAINT "pricing_factors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_faq"
    ADD CONSTRAINT "pricing_faq_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_tiers"
    ADD CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rsvp_responses"
    ADD CONSTRAINT "rsvp_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_assets"
    ADD CONSTRAINT "site_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."songs"
    ADD CONSTRAINT "songs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id");



CREATE INDEX "booking_agreements_booking_id_idx" ON "public"."booking_agreements" USING "btree" ("booking_id");



CREATE INDEX "booking_items_booking_id_idx" ON "public"."booking_items" USING "btree" ("booking_id");



CREATE INDEX "booking_payments_booking_id_idx" ON "public"."booking_payments" USING "btree" ("booking_id");



CREATE INDEX "bookings_artist_id_idx" ON "public"."bookings" USING "btree" ("artist_id");



CREATE INDEX "bookings_delivery_slug_idx" ON "public"."bookings" USING "btree" ("delivery_slug");



CREATE INDEX "bookings_event_date_idx" ON "public"."bookings" USING "btree" ("event_date");



CREATE INDEX "bookings_offer_slug_idx" ON "public"."bookings" USING "btree" ("offer_slug");



CREATE INDEX "bookings_status_idx" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "checklist_comments_item_id_idx" ON "public"."checklist_comments" USING "btree" ("item_id");



CREATE INDEX "checklist_items_booking_id_idx" ON "public"."checklist_items" USING "btree" ("booking_id");



CREATE INDEX "checklist_items_event_project_id_idx" ON "public"."checklist_items" USING "btree" ("event_project_id");



CREATE UNIQUE INDEX "company_goals_year_metric_idx" ON "public"."company_goals" USING "btree" ("year", "metric", COALESCE("label", ''::"text"));



CREATE INDEX "dj_profiles_slug_idx" ON "public"."dj_profiles" USING "btree" ("slug");



CREATE INDEX "dj_profiles_sort_order_idx" ON "public"."dj_profiles" USING "btree" ("sort_order");



CREATE INDEX "event_ai_outputs_project_idx" ON "public"."event_ai_outputs" USING "btree" ("event_project_id");



CREATE INDEX "event_projects_booking_id_idx" ON "public"."event_projects" USING "btree" ("booking_id");



CREATE INDEX "event_schedule_items_project_idx" ON "public"."event_schedule_items" USING "btree" ("event_project_id");



CREATE OR REPLACE TRIGGER "bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "checklist_items_updated_at" BEFORE UPDATE ON "public"."checklist_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "company_goals_updated_at" BEFORE UPDATE ON "public"."company_goals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "company_tasks_updated_at" BEFORE UPDATE ON "public"."company_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "event_ai_outputs_updated_at" BEFORE UPDATE ON "public"."event_ai_outputs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "event_projects_updated_at" BEFORE UPDATE ON "public"."event_projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "event_schedule_items_updated_at" BEFORE UPDATE ON "public"."event_schedule_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."booking_agreements"
    ADD CONSTRAINT "booking_agreements_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_items"
    ADD CONSTRAINT "booking_items_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."dj_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."booking_items"
    ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_payments"
    ADD CONSTRAINT "booking_payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."dj_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."checklist_comments"
    ADD CONSTRAINT "checklist_comments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checklist_comments"
    ADD CONSTRAINT "checklist_comments_event_project_id_fkey" FOREIGN KEY ("event_project_id") REFERENCES "public"."event_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checklist_comments"
    ADD CONSTRAINT "checklist_comments_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."checklist_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checklist_items"
    ADD CONSTRAINT "checklist_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checklist_items"
    ADD CONSTRAINT "checklist_items_event_project_id_fkey" FOREIGN KEY ("event_project_id") REFERENCES "public"."event_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_task_completions"
    ADD CONSTRAINT "company_task_completions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."company_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_ai_outputs"
    ADD CONSTRAINT "event_ai_outputs_event_project_id_fkey" FOREIGN KEY ("event_project_id") REFERENCES "public"."event_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_projects"
    ADD CONSTRAINT "event_projects_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_schedule_items"
    ADD CONSTRAINT "event_schedule_items_event_project_id_fkey" FOREIGN KEY ("event_project_id") REFERENCES "public"."event_projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_assigned_dj_id_fkey" FOREIGN KEY ("assigned_dj_id") REFERENCES "public"."dj_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."memory_events"
    ADD CONSTRAINT "memory_events_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."memory_uploads"
    ADD CONSTRAINT "memory_uploads_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."memory_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rsvp_responses"
    ADD CONSTRAINT "rsvp_responses_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE CASCADE;



CREATE POLICY "Performer application insert" ON "public"."dj_profiles" FOR INSERT WITH CHECK (("application_status" = 'pending'::"text"));



CREATE POLICY "Performers public read" ON "public"."dj_profiles" FOR SELECT USING ((("is_active" = true) AND ("application_status" = 'approved'::"text")));



CREATE POLICY "Public read" ON "public"."concepts" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public read published" ON "public"."journal_posts" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Service role full access inquiries" ON "public"."inquiries" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access site_assets" ON "public"."site_assets" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access songs" ON "public"."songs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Site assets public read" ON "public"."site_assets" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Songs public read" ON "public"."songs" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."booking_agreements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checklist_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checklist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_task_completions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."concepts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dj_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_ai_outputs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_schedule_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inquiries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journal_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memory_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memory_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pricing_factors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pricing_faq" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pricing_tiers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public insert memory uploads" ON "public"."memory_uploads" FOR INSERT WITH CHECK (true);



CREATE POLICY "public insert rsvp" ON "public"."rsvp_responses" FOR INSERT WITH CHECK (true);



CREATE POLICY "public read active invitations" ON "public"."invitations" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public read active memory events" ON "public"."memory_events" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public read memory uploads" ON "public"."memory_uploads" FOR SELECT USING (true);



ALTER TABLE "public"."rsvp_responses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service full invitations" ON "public"."invitations" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service full memory events" ON "public"."memory_events" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service full memory uploads" ON "public"."memory_uploads" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service full rsvp" ON "public"."rsvp_responses" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."site_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."songs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."testimonials" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."booking_agreements" TO "anon";
GRANT ALL ON TABLE "public"."booking_agreements" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_agreements" TO "service_role";



GRANT ALL ON TABLE "public"."booking_items" TO "anon";
GRANT ALL ON TABLE "public"."booking_items" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_items" TO "service_role";



GRANT ALL ON TABLE "public"."booking_payments" TO "anon";
GRANT ALL ON TABLE "public"."booking_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_payments" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."checklist_comments" TO "anon";
GRANT ALL ON TABLE "public"."checklist_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."checklist_comments" TO "service_role";



GRANT ALL ON TABLE "public"."checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."company_goals" TO "anon";
GRANT ALL ON TABLE "public"."company_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."company_goals" TO "service_role";



GRANT ALL ON TABLE "public"."company_task_completions" TO "anon";
GRANT ALL ON TABLE "public"."company_task_completions" TO "authenticated";
GRANT ALL ON TABLE "public"."company_task_completions" TO "service_role";



GRANT ALL ON TABLE "public"."company_tasks" TO "anon";
GRANT ALL ON TABLE "public"."company_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."company_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."concepts" TO "anon";
GRANT ALL ON TABLE "public"."concepts" TO "authenticated";
GRANT ALL ON TABLE "public"."concepts" TO "service_role";



GRANT ALL ON TABLE "public"."contact_messages" TO "anon";
GRANT ALL ON TABLE "public"."contact_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_messages" TO "service_role";



GRANT ALL ON TABLE "public"."dj_profiles" TO "anon";
GRANT ALL ON TABLE "public"."dj_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."dj_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."event_ai_outputs" TO "anon";
GRANT ALL ON TABLE "public"."event_ai_outputs" TO "authenticated";
GRANT ALL ON TABLE "public"."event_ai_outputs" TO "service_role";



GRANT ALL ON TABLE "public"."event_projects" TO "anon";
GRANT ALL ON TABLE "public"."event_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."event_projects" TO "service_role";



GRANT ALL ON TABLE "public"."event_schedule_items" TO "anon";
GRANT ALL ON TABLE "public"."event_schedule_items" TO "authenticated";
GRANT ALL ON TABLE "public"."event_schedule_items" TO "service_role";



GRANT ALL ON TABLE "public"."inquiries" TO "anon";
GRANT ALL ON TABLE "public"."inquiries" TO "authenticated";
GRANT ALL ON TABLE "public"."inquiries" TO "service_role";



GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



GRANT ALL ON TABLE "public"."journal_posts" TO "anon";
GRANT ALL ON TABLE "public"."journal_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_posts" TO "service_role";



GRANT ALL ON TABLE "public"."memory_events" TO "anon";
GRANT ALL ON TABLE "public"."memory_events" TO "authenticated";
GRANT ALL ON TABLE "public"."memory_events" TO "service_role";



GRANT ALL ON TABLE "public"."memory_uploads" TO "anon";
GRANT ALL ON TABLE "public"."memory_uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."memory_uploads" TO "service_role";



GRANT ALL ON TABLE "public"."packages" TO "anon";
GRANT ALL ON TABLE "public"."packages" TO "authenticated";
GRANT ALL ON TABLE "public"."packages" TO "service_role";



GRANT ALL ON TABLE "public"."partner_profiles" TO "anon";
GRANT ALL ON TABLE "public"."partner_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_factors" TO "anon";
GRANT ALL ON TABLE "public"."pricing_factors" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_factors" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_faq" TO "anon";
GRANT ALL ON TABLE "public"."pricing_faq" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_faq" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_tiers" TO "anon";
GRANT ALL ON TABLE "public"."pricing_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_tiers" TO "service_role";



GRANT ALL ON TABLE "public"."rsvp_responses" TO "anon";
GRANT ALL ON TABLE "public"."rsvp_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."rsvp_responses" TO "service_role";



GRANT ALL ON TABLE "public"."site_assets" TO "anon";
GRANT ALL ON TABLE "public"."site_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."site_assets" TO "service_role";



GRANT ALL ON TABLE "public"."songs" TO "anon";
GRANT ALL ON TABLE "public"."songs" TO "authenticated";
GRANT ALL ON TABLE "public"."songs" TO "service_role";



GRANT ALL ON TABLE "public"."testimonials" TO "anon";
GRANT ALL ON TABLE "public"."testimonials" TO "authenticated";
GRANT ALL ON TABLE "public"."testimonials" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







