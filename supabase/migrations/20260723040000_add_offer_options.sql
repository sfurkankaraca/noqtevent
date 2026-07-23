-- Teklif sayfası: sanatçı seçenekleri + konsept görsel seçenekleri
-- Müşteri /teklif/[slug] üzerinden sunulan sanatçı ve konsept arasından seçim yapıp gönderebilir.

CREATE TABLE IF NOT EXISTS offer_concepts (
  id uuid primary key default gen_random_uuid(),
  category text not null,          -- 'nisan' | 'evde-nisan' | 'evlilik-teklifi' | 'kurumsal'
  name text not null,
  image_url text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS offer_concepts_category_idx ON offer_concepts(category);
CREATE UNIQUE INDEX IF NOT EXISTS offer_concepts_category_name_idx ON offer_concepts(category, name);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS offer_artist_ids uuid[] DEFAULT '{}';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS offer_concept_category text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS offer_selected_artist_id uuid REFERENCES dj_profiles(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS offer_selected_concept_id uuid REFERENCES offer_concepts(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS offer_selection_note text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS offer_selection_at timestamptz;
