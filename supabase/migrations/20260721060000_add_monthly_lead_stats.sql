-- Aylık trend grafiği her sayfa yüklemesinde TÜM leads tablosunu tarayıp
-- demand_date'e göre gruplamak yerine, biten (geçmiş) ayların sayımını
-- burada önbelleğe alır. Sadece içinde bulunulan ay canlı hesaplanır.
CREATE TABLE monthly_lead_stats (
  month_key text PRIMARY KEY, -- 'YYYY-MM', demand_date'e göre
  total_count integer NOT NULL,
  won_count integer NOT NULL,
  lost_count integer NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now()
);
