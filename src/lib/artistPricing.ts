export type FeeRange = { min: number; max: number };

export type ArtistFeeData = {
  base_fee_min?: number | null;
  base_fee_max?: number | null;
  event_type_fees?: Record<string, FeeRange> | null;
};

// Bir sanatçının belirli bir etkinlik türü için kaşe aralığı.
// Etkinlik türüne özel bedel tanımlı değilse genel (base) aralığa düşer.
export function getArtistFeeRange(dj: ArtistFeeData, eventTypeId: string | null): FeeRange | null {
  const specific = eventTypeId ? dj.event_type_fees?.[eventTypeId] : null;
  if (specific && (specific.min > 0 || specific.max > 0)) return specific;

  if (dj.base_fee_min || dj.base_fee_max) {
    return { min: dj.base_fee_min ?? 0, max: dj.base_fee_max ?? dj.base_fee_min ?? 0 };
  }
  return null;
}

// Birden fazla sanatçı arasından (ör. planlayıcıda henüz sanatçı seçilmemişken)
// seçili etkinlik türü için genel bir tahmini aralık çıkarır: en düşük min - en yüksek max.
export function estimateFeeRangeAcrossArtists(
  artists: ArtistFeeData[],
  eventTypeId: string | null
): FeeRange | null {
  const ranges = artists
    .map((a) => getArtistFeeRange(a, eventTypeId))
    .filter((r): r is FeeRange => r !== null && (r.min > 0 || r.max > 0));

  if (ranges.length === 0) return null;

  return {
    min: Math.min(...ranges.map((r) => r.min)),
    max: Math.max(...ranges.map((r) => r.max)),
  };
}

// Kaşe değerleri "bin ₺" biriminde saklanır (ör. 10 = 10.000 ₺).
// Gösterimde tam TL'ye çevirmek için 1000 ile çarpılır.
export const FEE_UNIT = 1000;

export function formatFeeRange(range: FeeRange): string {
  const fmt = (n: number) => (n * FEE_UNIT).toLocaleString("tr-TR");
  if (range.min === range.max) return `${fmt(range.min)} ₺`;
  return `${fmt(range.min)}–${fmt(range.max)} ₺`;
}
