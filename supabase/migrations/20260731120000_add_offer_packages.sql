-- Çok seçenekli teklif: bir booking için birden fazla paket (A/B/C) sunulur,
-- müşteri /teklif/[slug] üzerinden birini seçer ve seçilen paketin fiyatı
-- booking.fee'ye yazılır — sözleşme, PDF ve ödeme akışı olduğu gibi çalışır.

CREATE TABLE IF NOT EXISTS public.booking_offer_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  title text NOT NULL,                       -- "Klasik", "Premium", "Full Prodüksiyon"
  subtitle text,                             -- kısa açıklama / kime uygun
  fee numeric(12,2) NOT NULL DEFAULT 0,      -- bu paketin peşin toplam bedeli
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{ title, description, amount }] kapsam maddeleri
  is_recommended boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS booking_offer_packages_booking_idx
  ON public.booking_offer_packages(booking_id, sort_order);

-- Public anon anahtarına kapalı; yalnızca service_role (server action/route) erişir
ALTER TABLE public.booking_offer_packages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS selected_package_id uuid
    REFERENCES public.booking_offer_packages(id) ON DELETE SET NULL;
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS package_selected_at timestamptz;
