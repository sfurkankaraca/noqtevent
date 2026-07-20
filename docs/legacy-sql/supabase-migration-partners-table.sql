-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS partner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),

  -- Identity
  business_name text NOT NULL,
  category text[] DEFAULT '{}',        -- e.g. ["Fotoğraf & Video", "Dekor"]
  description text,
  services text[] DEFAULT '{}',        -- specific services offered

  -- Media
  logo_url text,
  photos text[] DEFAULT '{}',

  -- Location
  city text,
  cover_cities text[] DEFAULT '{}',

  -- Contact
  contact_name text,
  email text,
  phone text,
  instagram_url text,
  website_url text,

  -- Status
  application_status text NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  is_active boolean NOT NULL DEFAULT false
);

-- RLS: public can read approved+active
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners public read" ON partner_profiles
  FOR SELECT USING (is_active = true AND application_status = 'approved');

-- Public INSERT for applications
CREATE POLICY "Partner application insert" ON partner_profiles
  FOR INSERT WITH CHECK (application_status = 'pending');
