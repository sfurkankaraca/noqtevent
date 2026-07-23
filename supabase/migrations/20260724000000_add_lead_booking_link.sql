-- Lead inbox'ta kişiye özel teklif linki üretebilmek için lead↔booking bağlantısı
ALTER TABLE leads ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL;
