-- M4a — Identity Spine: entity registry (person / organization / venue only)
-- Scope: additive only. No existing table is altered. No application code depends
-- on this yet. Kind list is deliberately narrow (community/event/course/content
-- are NOT added here — see docs/DEVELOPMENT_ROADMAP.md M4 and
-- docs/INTERACTION_ONTOLOGY.md — they belong to the later fact-log object
-- registry and are added only when a real consumer needs them).
--
-- Design reference: architecture approved in founder/CTO discussion, 2026-07-20.

-- ── entities ─────────────────────────────────────────────────────────────────
-- Thin registry: issues canonical IDs and tags kind. No business data lives here.
CREATE TABLE entities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL CHECK (kind IN ('person', 'organization', 'venue')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- Enables composite FKs below that guarantee a referencing row's entity is
  -- actually of the expected kind — pure relational constraint, no triggers.
  UNIQUE (id, kind)
);

CREATE INDEX entities_kind_idx ON entities (kind);

-- ── person_details ───────────────────────────────────────────────────────────
CREATE TABLE person_details (
  entity_id      uuid PRIMARY KEY,
  entity_kind    text NOT NULL DEFAULT 'person' CHECK (entity_kind = 'person'),
  -- Canonical identity email for this person. The ONLY field used for
  -- human matching/dedup. Deliberately NOT unique yet — see migration notes.
  primary_email  text,
  display_name   text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (entity_id, entity_kind) REFERENCES entities (id, kind)
);

CREATE INDEX person_details_email_idx ON person_details (lower(primary_email));

-- ── organization_details ─────────────────────────────────────────────────────
CREATE TABLE organization_details (
  entity_id      uuid PRIMARY KEY,
  entity_kind    text NOT NULL DEFAULT 'organization' CHECK (entity_kind = 'organization'),
  legal_name     text NOT NULL,
  -- Canonical identity email for this organization — separate namespace from
  -- person emails; never cross-matched against person_details.primary_email.
  primary_email  text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (entity_id, entity_kind) REFERENCES entities (id, kind)
);

CREATE INDEX organization_details_email_idx ON organization_details (lower(primary_email));

-- ── venue_details ─────────────────────────────────────────────────────────────
CREATE TABLE venue_details (
  entity_id                    uuid PRIMARY KEY,
  entity_kind                  text NOT NULL DEFAULT 'venue' CHECK (entity_kind = 'venue'),
  name                         text NOT NULL,
  address                      text,
  -- Optional link to the organization operating this venue. A venue is a
  -- passive location, not an actor — it never holds a role itself (see roles
  -- table below); the operating organization is the actual business relationship.
  operated_by_organization_id  uuid,
  operated_by_kind             text CHECK (operated_by_kind IS NULL OR operated_by_kind = 'organization'),
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (entity_id, entity_kind) REFERENCES entities (id, kind),
  FOREIGN KEY (operated_by_organization_id, operated_by_kind) REFERENCES entities (id, kind)
);

-- ── credentials ───────────────────────────────────────────────────────────────
-- Authentication linkage. Deliberately separate from person_details: a person
-- can exist (CRM lead, RSVP guest, unapproved applicant) with zero credentials.
CREATE TABLE credentials (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id         uuid NOT NULL,
  -- Credentials may ONLY attach to person entities — enforced relationally via
  -- the composite FK below, not by application code.
  entity_kind       text NOT NULL DEFAULT 'person' CHECK (entity_kind = 'person'),
  provider          text NOT NULL,        -- 'clerk' today; provider-extensible
  provider_user_id  text NOT NULL,        -- e.g. Clerk's userId
  -- Snapshot of the provider's reported email at credential-creation time.
  -- NON-CANONICAL — never used for identity matching. See person_details.primary_email.
  email             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (entity_id, entity_kind) REFERENCES entities (id, kind),
  UNIQUE (provider, provider_user_id)
);

CREATE INDEX credentials_entity_id_idx ON credentials (entity_id);

-- ── roles ─────────────────────────────────────────────────────────────────────
-- A capacity a person or organization holds within a specific product, with its
-- own lifecycle. Role-specific business data (rider, presskit, toolkit, etc.)
-- stays in product-owned tables (dj_profiles, partner_profiles) — never
-- duplicated into this table or its metadata column.
CREATE TABLE roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id   uuid NOT NULL,
  -- Roles attach to persons or organizations only — never venues (a venue is a
  -- passive location; the operating organization holds the relationship).
  entity_kind text NOT NULL CHECK (entity_kind IN ('person', 'organization')),
  role        text NOT NULL CHECK (role IN
    ('admin', 'artist', 'partner', 'client', 'venue_operator', 'instructor', 'student', 'social_user')),
  product     text NOT NULL CHECK (product IN ('events', 'club', 'social')),
  granted_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at  timestamptz,
  metadata    jsonb NOT NULL DEFAULT '{}',
  FOREIGN KEY (entity_id, entity_kind) REFERENCES entities (id, kind)
);

CREATE INDEX roles_entity_id_idx ON roles (entity_id);

-- Prevents granting the same active role twice for the same entity/product.
CREATE UNIQUE INDEX roles_active_unique_idx ON roles (entity_id, role, product) WHERE revoked_at IS NULL;
