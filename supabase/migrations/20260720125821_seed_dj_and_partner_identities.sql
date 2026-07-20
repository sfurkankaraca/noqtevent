-- M4d — Identity seed: 18 approved DJ/artist acts + 7 high-confidence partner organizations
-- Idempotent: safe to re-run. entities/details use ON CONFLICT (id) DO NOTHING (fixed UUIDs,
-- generated locally, not DB-generated, so this script's output is reviewable before execution).
-- roles uses the existing partial unique index as the conflict target. dj_profiles/
-- partner_profiles UPDATEs are guarded by `AND entity_id IS NULL`, so a second run is a no-op
-- wherever linking already happened.
--
-- Explicitly NOT done here: no primary_email for DJ persons/organizations (dj_profiles.email is
-- operational contact metadata, not identity — see M4c founder correction). No merging by email —
-- every row gets its own entity even where emails are shared (e.g. ASECO/M3L).

BEGIN;

-- ── DJ / artist acts (18) ──────────────────────────────────────────────────
-- Mert Şeref Yiğit (person)
INSERT INTO entities (id, kind) VALUES ('756c5481-0bc6-4bb3-9af3-d8951ede3e8d', 'person') ON CONFLICT (id) DO NOTHING;
INSERT INTO person_details (entity_id, display_name) VALUES ('756c5481-0bc6-4bb3-9af3-d8951ede3e8d', 'Mert Şeref Yiğit') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('756c5481-0bc6-4bb3-9af3-d8951ede3e8d', 'person', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = '756c5481-0bc6-4bb3-9af3-d8951ede3e8d' WHERE id = 'd294d7ad-2117-442a-bd65-836690751aaf' AND entity_id IS NULL;

-- YSEIKO (person)
INSERT INTO entities (id, kind) VALUES ('ee668aa4-70e9-4b89-8e39-38f9ed7d2ca9', 'person') ON CONFLICT (id) DO NOTHING;
INSERT INTO person_details (entity_id, display_name) VALUES ('ee668aa4-70e9-4b89-8e39-38f9ed7d2ca9', 'YSEIKO') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('ee668aa4-70e9-4b89-8e39-38f9ed7d2ca9', 'person', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = 'ee668aa4-70e9-4b89-8e39-38f9ed7d2ca9' WHERE id = '4c3830a1-497b-40d2-aa34-91346a3f5f21' AND entity_id IS NULL;

-- Melike Karaköse (person)
INSERT INTO entities (id, kind) VALUES ('c606a73c-428e-4943-ab71-1ab1c397f27b', 'person') ON CONFLICT (id) DO NOTHING;
INSERT INTO person_details (entity_id, display_name) VALUES ('c606a73c-428e-4943-ab71-1ab1c397f27b', 'Melike Karaköse') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('c606a73c-428e-4943-ab71-1ab1c397f27b', 'person', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = 'c606a73c-428e-4943-ab71-1ab1c397f27b' WHERE id = '5f4efe31-5d77-422c-9a4e-dedb6af05a9d' AND entity_id IS NULL;

-- Maocan (person)
INSERT INTO entities (id, kind) VALUES ('6d4ba77f-c602-48ec-a8cd-103a8cd7e566', 'person') ON CONFLICT (id) DO NOTHING;
INSERT INTO person_details (entity_id, display_name) VALUES ('6d4ba77f-c602-48ec-a8cd-103a8cd7e566', 'Maocan') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('6d4ba77f-c602-48ec-a8cd-103a8cd7e566', 'person', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = '6d4ba77f-c602-48ec-a8cd-103a8cd7e566' WHERE id = 'f1a88071-5b86-4e9d-9aec-04f4e89260af' AND entity_id IS NULL;

-- Emre Okay (person)
INSERT INTO entities (id, kind) VALUES ('f826d554-0430-44fc-ba7d-668b86d7610b', 'person') ON CONFLICT (id) DO NOTHING;
INSERT INTO person_details (entity_id, display_name) VALUES ('f826d554-0430-44fc-ba7d-668b86d7610b', 'Emre Okay') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('f826d554-0430-44fc-ba7d-668b86d7610b', 'person', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = 'f826d554-0430-44fc-ba7d-668b86d7610b' WHERE id = 'afa2a9ed-8e77-43f1-a331-f2caa82d0694' AND entity_id IS NULL;

-- Trios (organization)
INSERT INTO entities (id, kind) VALUES ('b2b47589-81c1-46ca-b04c-de9a634176ab', 'organization') ON CONFLICT (id) DO NOTHING;
INSERT INTO organization_details (entity_id, legal_name) VALUES ('b2b47589-81c1-46ca-b04c-de9a634176ab', 'Trios') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('b2b47589-81c1-46ca-b04c-de9a634176ab', 'organization', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = 'b2b47589-81c1-46ca-b04c-de9a634176ab' WHERE id = '75677b74-9d56-4c72-bbd2-b4503e17bd6c' AND entity_id IS NULL;

-- Celal Bağtaş & Dnb Orkestrası (organization)
INSERT INTO entities (id, kind) VALUES ('83add754-bd08-48ff-8ac6-90525c565fd8', 'organization') ON CONFLICT (id) DO NOTHING;
INSERT INTO organization_details (entity_id, legal_name) VALUES ('83add754-bd08-48ff-8ac6-90525c565fd8', 'Celal Bağtaş & Dnb Orkestrası') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('83add754-bd08-48ff-8ac6-90525c565fd8', 'organization', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = '83add754-bd08-48ff-8ac6-90525c565fd8' WHERE id = '579c0f3a-cda0-4f49-8f8d-4bf14f4a1059' AND entity_id IS NULL;

-- ASECO (person)
INSERT INTO entities (id, kind) VALUES ('7032a12b-3cc1-4cee-bd96-836447ad603a', 'person') ON CONFLICT (id) DO NOTHING;
INSERT INTO person_details (entity_id, display_name) VALUES ('7032a12b-3cc1-4cee-bd96-836447ad603a', 'ASECO') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('7032a12b-3cc1-4cee-bd96-836447ad603a', 'person', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = '7032a12b-3cc1-4cee-bd96-836447ad603a' WHERE id = '8b801de5-b259-43fb-93e2-eb0175ae7bac' AND entity_id IS NULL;

-- M3L (person)
INSERT INTO entities (id, kind) VALUES ('a35f156b-0517-4fc5-a975-b82a1c046cb1', 'person') ON CONFLICT (id) DO NOTHING;
INSERT INTO person_details (entity_id, display_name) VALUES ('a35f156b-0517-4fc5-a975-b82a1c046cb1', 'M3L') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('a35f156b-0517-4fc5-a975-b82a1c046cb1', 'person', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = 'a35f156b-0517-4fc5-a975-b82a1c046cb1' WHERE id = 'fb2c693d-7a24-404a-8a5a-18c340a2c657' AND entity_id IS NULL;

-- Yezdan Şahin (person)
INSERT INTO entities (id, kind) VALUES ('1a92cc35-5144-4a48-849e-37c82171a1ab', 'person') ON CONFLICT (id) DO NOTHING;
INSERT INTO person_details (entity_id, display_name) VALUES ('1a92cc35-5144-4a48-849e-37c82171a1ab', 'Yezdan Şahin') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('1a92cc35-5144-4a48-849e-37c82171a1ab', 'person', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = '1a92cc35-5144-4a48-849e-37c82171a1ab' WHERE id = '97acfb41-c98e-4576-b196-cab453cb7b43' AND entity_id IS NULL;

-- Erdal Coşkun (person)
INSERT INTO entities (id, kind) VALUES ('c76e0792-e759-41e5-a59a-308b2870866e', 'person') ON CONFLICT (id) DO NOTHING;
INSERT INTO person_details (entity_id, display_name) VALUES ('c76e0792-e759-41e5-a59a-308b2870866e', 'Erdal Coşkun') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('c76e0792-e759-41e5-a59a-308b2870866e', 'person', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = 'c76e0792-e759-41e5-a59a-308b2870866e' WHERE id = 'b3e78910-67fc-47fa-a6fe-aa14a77ca9c9' AND entity_id IS NULL;

-- Furkan Karaca (person)
INSERT INTO entities (id, kind) VALUES ('e2e7b134-c51e-438d-99a2-e9dae869ddf1', 'person') ON CONFLICT (id) DO NOTHING;
INSERT INTO person_details (entity_id, display_name) VALUES ('e2e7b134-c51e-438d-99a2-e9dae869ddf1', 'Furkan Karaca') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('e2e7b134-c51e-438d-99a2-e9dae869ddf1', 'person', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = 'e2e7b134-c51e-438d-99a2-e9dae869ddf1' WHERE id = '51ca08a0-3fa6-47f5-ac83-d068e59c75bb' AND entity_id IS NULL;

-- Golden Hour Session (organization)
INSERT INTO entities (id, kind) VALUES ('89b1d9f1-0a39-4cd6-a5fd-65bbb4f659ab', 'organization') ON CONFLICT (id) DO NOTHING;
INSERT INTO organization_details (entity_id, legal_name) VALUES ('89b1d9f1-0a39-4cd6-a5fd-65bbb4f659ab', 'Golden Hour Session') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('89b1d9f1-0a39-4cd6-a5fd-65bbb4f659ab', 'organization', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = '89b1d9f1-0a39-4cd6-a5fd-65bbb4f659ab' WHERE id = '1e52033a-8ebb-497c-a991-9b25afb80c6a' AND entity_id IS NULL;

-- Sercan Budak (person)
INSERT INTO entities (id, kind) VALUES ('e4e61765-21dc-4ef5-90e4-f8b474300c11', 'person') ON CONFLICT (id) DO NOTHING;
INSERT INTO person_details (entity_id, display_name) VALUES ('e4e61765-21dc-4ef5-90e4-f8b474300c11', 'Sercan Budak') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('e4e61765-21dc-4ef5-90e4-f8b474300c11', 'person', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = 'e4e61765-21dc-4ef5-90e4-f8b474300c11' WHERE id = '55e46d97-9a25-4911-a6e5-ed63bd0f502c' AND entity_id IS NULL;

-- Gözde Duran (person)
INSERT INTO entities (id, kind) VALUES ('ce8f72d5-8220-4f8f-aef3-9255f8cef89e', 'person') ON CONFLICT (id) DO NOTHING;
INSERT INTO person_details (entity_id, display_name) VALUES ('ce8f72d5-8220-4f8f-aef3-9255f8cef89e', 'Gözde Duran') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('ce8f72d5-8220-4f8f-aef3-9255f8cef89e', 'person', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = 'ce8f72d5-8220-4f8f-aef3-9255f8cef89e' WHERE id = 'c9691a28-bd30-4e9f-89e5-bd3324a9166d' AND entity_id IS NULL;

-- Arzu Aktaş (person)
INSERT INTO entities (id, kind) VALUES ('afd42650-c198-4ab3-9536-b5f377b5e0d9', 'person') ON CONFLICT (id) DO NOTHING;
INSERT INTO person_details (entity_id, display_name) VALUES ('afd42650-c198-4ab3-9536-b5f377b5e0d9', 'Arzu Aktaş') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('afd42650-c198-4ab3-9536-b5f377b5e0d9', 'person', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = 'afd42650-c198-4ab3-9536-b5f377b5e0d9' WHERE id = 'f171c746-ecbc-4d16-a571-627449b6955b' AND entity_id IS NULL;

-- Aslound (person)
INSERT INTO entities (id, kind) VALUES ('57393e1b-d0e2-47db-8842-0750e2209fd7', 'person') ON CONFLICT (id) DO NOTHING;
INSERT INTO person_details (entity_id, display_name) VALUES ('57393e1b-d0e2-47db-8842-0750e2209fd7', 'Aslound') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('57393e1b-d0e2-47db-8842-0750e2209fd7', 'person', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = '57393e1b-d0e2-47db-8842-0750e2209fd7' WHERE id = '2b63e0a0-0c25-43d4-86cb-f7a6ab417195' AND entity_id IS NULL;

-- Bandotuzsekiz (organization)
INSERT INTO entities (id, kind) VALUES ('ce0719f7-64e7-4c79-9b19-a93bedc6db77', 'organization') ON CONFLICT (id) DO NOTHING;
INSERT INTO organization_details (entity_id, legal_name) VALUES ('ce0719f7-64e7-4c79-9b19-a93bedc6db77', 'Bandotuzsekiz') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('ce0719f7-64e7-4c79-9b19-a93bedc6db77', 'organization', 'artist', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE dj_profiles SET entity_id = 'ce0719f7-64e7-4c79-9b19-a93bedc6db77' WHERE id = '3e7ee49a-44a2-4a5e-b26f-a53ac5b0c4fd' AND entity_id IS NULL;

-- ── Partner organizations (7) ─────────────────────────────────────────────
-- Valls Gelinlik ve Moda Evi
INSERT INTO entities (id, kind) VALUES ('18c095aa-363a-4866-856d-9a0fa36844ba', 'organization') ON CONFLICT (id) DO NOTHING;
INSERT INTO organization_details (entity_id, legal_name, primary_email) VALUES ('18c095aa-363a-4866-856d-9a0fa36844ba', 'Valls Gelinlik ve Moda Evi', 'info@valls.com.tr') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('18c095aa-363a-4866-856d-9a0fa36844ba', 'organization', 'partner', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE partner_profiles SET entity_id = '18c095aa-363a-4866-856d-9a0fa36844ba' WHERE id = 'bc8d8069-f980-4921-9f86-f898780d3ff9' AND entity_id IS NULL;

-- Museum Hotel Cappadocia
INSERT INTO entities (id, kind) VALUES ('22234e80-a5d8-4fd8-9b5d-8d99f8c349d3', 'organization') ON CONFLICT (id) DO NOTHING;
INSERT INTO organization_details (entity_id, legal_name, primary_email) VALUES ('22234e80-a5d8-4fd8-9b5d-8d99f8c349d3', 'Museum Hotel Cappadocia', 'info@museumhotel.com') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('22234e80-a5d8-4fd8-9b5d-8d99f8c349d3', 'organization', 'partner', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE partner_profiles SET entity_id = '22234e80-a5d8-4fd8-9b5d-8d99f8c349d3' WHERE id = '84de4aa4-891a-495b-8ab4-d4609e6894c0' AND entity_id IS NULL;

-- The Cappadocia Photographer
INSERT INTO entities (id, kind) VALUES ('d0d92e67-1ff9-456b-ab5f-e3cde78fea93', 'organization') ON CONFLICT (id) DO NOTHING;
INSERT INTO organization_details (entity_id, legal_name, primary_email) VALUES ('d0d92e67-1ff9-456b-ab5f-e3cde78fea93', 'The Cappadocia Photographer', 'info@thecappadociaphotographer.com') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('d0d92e67-1ff9-456b-ab5f-e3cde78fea93', 'organization', 'partner', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE partner_profiles SET entity_id = 'd0d92e67-1ff9-456b-ab5f-e3cde78fea93' WHERE id = '803213b1-f4ae-4ed5-9472-a0b6b81ea569' AND entity_id IS NULL;

-- Cappadocia Wedding Photos
INSERT INTO entities (id, kind) VALUES ('a8d8b8f5-cae3-4c2e-bd82-2fec65820a81', 'organization') ON CONFLICT (id) DO NOTHING;
INSERT INTO organization_details (entity_id, legal_name, primary_email) VALUES ('a8d8b8f5-cae3-4c2e-bd82-2fec65820a81', 'Cappadocia Wedding Photos', 'info@cappadociaweddingphotos.com') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('a8d8b8f5-cae3-4c2e-bd82-2fec65820a81', 'organization', 'partner', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE partner_profiles SET entity_id = 'a8d8b8f5-cae3-4c2e-bd82-2fec65820a81' WHERE id = 'a6d4c62b-a473-46e7-891b-4fd1db375bc4' AND entity_id IS NULL;

-- Yeşim Gelinlik
INSERT INTO entities (id, kind) VALUES ('9330178d-1a4a-4b55-bfcd-e6f7a6bea2c5', 'organization') ON CONFLICT (id) DO NOTHING;
INSERT INTO organization_details (entity_id, legal_name, primary_email) VALUES ('9330178d-1a4a-4b55-bfcd-e6f7a6bea2c5', 'Yeşim Gelinlik', 'info@yesimgelinlik.com') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('9330178d-1a4a-4b55-bfcd-e6f7a6bea2c5', 'organization', 'partner', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE partner_profiles SET entity_id = '9330178d-1a4a-4b55-bfcd-e6f7a6bea2c5' WHERE id = 'abcec3f7-29b0-464d-a891-2db6a7c9c05e' AND entity_id IS NULL;

-- İdeal Moonlight Garden (İdeal Düğün Salonları)
INSERT INTO entities (id, kind) VALUES ('0be50dc9-9e99-45fc-9061-2c85c279201e', 'organization') ON CONFLICT (id) DO NOTHING;
INSERT INTO organization_details (entity_id, legal_name, primary_email) VALUES ('0be50dc9-9e99-45fc-9061-2c85c279201e', 'İdeal Moonlight Garden (İdeal Düğün Salonları)', 'ayisigi0038@hotmail.com') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('0be50dc9-9e99-45fc-9061-2c85c279201e', 'organization', 'partner', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE partner_profiles SET entity_id = '0be50dc9-9e99-45fc-9061-2c85c279201e' WHERE id = '66e1c81a-0065-4078-bfc2-5fab6ab19c20' AND entity_id IS NULL;

-- Kayseri Gelin Arabası
INSERT INTO entities (id, kind) VALUES ('2ebbc388-e963-496c-bca6-ce848f5b6e80', 'organization') ON CONFLICT (id) DO NOTHING;
INSERT INTO organization_details (entity_id, legal_name, primary_email) VALUES ('2ebbc388-e963-496c-bca6-ce848f5b6e80', 'Kayseri Gelin Arabası', 'gelinarabasi38@gmail.com') ON CONFLICT (entity_id) DO NOTHING;
INSERT INTO roles (entity_id, entity_kind, role, product) VALUES ('2ebbc388-e963-496c-bca6-ce848f5b6e80', 'organization', 'partner', 'events') ON CONFLICT (entity_id, role, product) WHERE revoked_at IS NULL DO NOTHING;
UPDATE partner_profiles SET entity_id = '2ebbc388-e963-496c-bca6-ce848f5b6e80' WHERE id = 'b520115b-a822-4245-863a-6c4ee11f62be' AND entity_id IS NULL;

COMMIT;