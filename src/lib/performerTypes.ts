// Sanatçı türü sabitleri — sekmelerde solo sanatçı / grup / orkestra
// "Canlı Müzik" başlığı altında birleşik gösterilir.

export const LIVE_MUSIC_TAB_ID = "canli-muzik";

// Bu türler public ve admin listelerinde tek sekmede toplanır
export const LIVE_MUSIC_TYPES = ["artist", "grup", "orkestra"];

// Kart rozetlerinde ve formlarda kullanılan tekil türler
export const PERFORMER_TYPE_LABELS = [
  { id: "dj", label: "DJ", emoji: "🎧" },
  { id: "artist", label: "Solo Sanatçı", emoji: "🎤" },
  { id: "trio", label: "Trio", emoji: "🎶" },
  { id: "grup", label: "Grup", emoji: "👥" },
  { id: "dance", label: "Dans Ekibi", emoji: "💃" },
  { id: "bando", label: "Bando", emoji: "🎺" },
  { id: "orkestra", label: "Orkestra", emoji: "🎻" },
  { id: "host", label: "Sunucu / MC", emoji: "🎙️" },
  { id: "moderator", label: "Moderatör", emoji: "🗣️" },
];

// Sekme listesi — artist/grup/orkestra yerine tek "Canlı Müzik" girişi
export const PERFORMER_TABS = [
  { id: "dj", label: "DJ", emoji: "🎧" },
  { id: LIVE_MUSIC_TAB_ID, label: "Canlı Müzik", emoji: "🎤" },
  { id: "trio", label: "Trio", emoji: "🎶" },
  { id: "dance", label: "Dans Ekibi", emoji: "💃" },
  { id: "bando", label: "Bando", emoji: "🎺" },
  { id: "host", label: "Sunucu / MC", emoji: "🎙️" },
  { id: "moderator", label: "Moderatör", emoji: "🗣️" },
];

// Eski ?type=artist|grup|orkestra linkleri birleşik sekmeye yönlenir
export function resolveTabId(type: string): string {
  return LIVE_MUSIC_TYPES.includes(type) ? LIVE_MUSIC_TAB_ID : type;
}

// Bir sekmenin kapsadığı performer_type değerleri
export function tabTypes(tabId: string): string[] {
  return tabId === LIVE_MUSIC_TAB_ID ? LIVE_MUSIC_TYPES : [tabId];
}
