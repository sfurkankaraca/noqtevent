-- M4b — link dj_profiles / partner_profiles to the identity registry (M4a).
-- Purely structural: nullable FK columns only. No data populated, no rows
-- classified (see docs/DEVELOPMENT_ROADMAP.md M4c for the pending dry-run
-- report before any seeding). No application code, auth flow, or existing
-- column touched.

ALTER TABLE dj_profiles
  ADD COLUMN entity_id uuid REFERENCES entities (id);

CREATE INDEX dj_profiles_entity_id_idx ON dj_profiles (entity_id);

ALTER TABLE partner_profiles
  ADD COLUMN entity_id uuid REFERENCES entities (id);

CREATE INDEX partner_profiles_entity_id_idx ON partner_profiles (entity_id);
