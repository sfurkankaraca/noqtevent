// Saf eşleme testleri. Repoda test aracı yok — Node'un yerleşik test
// koşucusu + tip soyma kullanılıyor (bkz. package.json "test" script'i).
// Bu yüzden .ts dosyası açık uzantıyla import ediliyor.
import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveGenres,
  djProfileToArtistProfile,
  extractSpotifyArtistId,
  mapPerformerType,
  pickUniqueArtistSlug,
} from "./djProfileToArtistProfile.ts";

const baseDj = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "DJ Kayseri",
};

test("performer_type sözlükleri eşlenir", () => {
  assert.equal(mapPerformerType("dj"), "dj");
  assert.equal(mapPerformerType("artist"), "solo");
  assert.equal(mapPerformerType("grup"), "band");
  assert.equal(mapPerformerType("orkestra"), "band");
  assert.equal(mapPerformerType("bando"), "band");
  assert.equal(mapPerformerType("trio"), "band");
  assert.equal(mapPerformerType("dance"), "other");
  assert.equal(mapPerformerType("host"), "other");
  assert.equal(mapPerformerType("moderator"), "other");
  // Bilinmeyen / boş değer güvenli tarafa düşer.
  assert.equal(mapPerformerType(null), "other");
  assert.equal(mapPerformerType("saksafon"), "other");
});

test("spotify_artist_id linkten ayıklanır", () => {
  assert.equal(
    extractSpotifyArtistId("https://open.spotify.com/artist/0TnOYISbd1XYRBk9myaseg?si=abc"),
    "0TnOYISbd1XYRBk9myaseg"
  );
  assert.equal(
    extractSpotifyArtistId("https://open.spotify.com/intl-tr/artist/0TnOYISbd1XYRBk9myaseg"),
    "0TnOYISbd1XYRBk9myaseg"
  );
  assert.equal(extractSpotifyArtistId("spotify:artist:0TnOYISbd1XYRBk9myaseg"), "0TnOYISbd1XYRBk9myaseg");
  // Sanatçı değil parça linki → uydurma yapılmaz.
  assert.equal(extractSpotifyArtistId("https://open.spotify.com/track/0TnOYISbd1XYRBk9myaseg"), null);
  assert.equal(extractSpotifyArtistId(null), null);
});

test("genres speciality/repertoire'dan türetilir, uzun cümle atılır", () => {
  assert.deepEqual(
    deriveGenres({ ...baseDj, speciality: "Pop, Rock / Türkçe Slow", repertoire: "Pop" }),
    ["Pop", "Rock", "Türkçe Slow"]
  );
  const long = "Düğünlerde ağırlıklı olarak Türkçe pop ve slow parçalar çalıyorum";
  assert.deepEqual(deriveGenres({ ...baseDj, repertoire: long }), []);
});

test("genres boşsa concept_tags'e düşülür, o da yoksa []", () => {
  assert.deepEqual(deriveGenres({ ...baseDj, concept_tags: ["sohbet-arasi", "after-party"] }), [
    "Sohbet Arasi",
    "After Party",
  ]);
  assert.deepEqual(deriveGenres(baseDj), []);
});

test("slug çakışmasında -2, -3 eklenir", () => {
  assert.equal(pickUniqueArtistSlug("dj-kayseri", []), "dj-kayseri");
  assert.equal(pickUniqueArtistSlug("dj-kayseri", ["dj-kayseri"]), "dj-kayseri-2");
  assert.equal(pickUniqueArtistSlug("dj-kayseri", ["dj-kayseri", "dj-kayseri-2"]), "dj-kayseri-3");
});

test("tam eşleme: alanlar taşınır, onaylı+yayında doğar", () => {
  const out = djProfileToArtistProfile(
    {
      ...baseDj,
      bio: "  10 yıllık DJ  ",
      city: "Kayseri",
      performer_type: "grup",
      speciality: "House",
      photos: ["https://a/1.jpg", "https://a/2.jpg"],
      photo_url: "https://a/eski.jpg",
      videos: ["https://v/1.mp4"],
      youtube_links: ["https://youtu.be/x"],
      instagram_url: "https://instagram.com/x",
      spotify_url: "https://open.spotify.com/artist/0TnOYISbd1XYRBk9myaseg",
      soundcloud_url: "https://soundcloud.com/x",
      website_url: "https://x.com",
      youtube_url: null,
    },
    { entityId: "22222222-2222-2222-2222-222222222222", slug: "dj-kayseri" }
  );

  assert.equal(out.display_name, "DJ Kayseri");
  assert.equal(out.bio, "10 yıllık DJ");
  assert.equal(out.entity_kind, "person");
  assert.equal(out.performer_type, "band");
  assert.equal(out.review_status, "approved");
  assert.equal(out.is_published, true);
  assert.equal(out.claim_status, "unclaimed");
  assert.equal(out.legacy_dj_profile_id, baseDj.id);
  // Kapak galerinin ilki (tekil photo_url'i ezer).
  assert.equal(out.photo_url, "https://a/1.jpg");
  assert.deepEqual(out.photo_urls, ["https://a/1.jpg", "https://a/2.jpg"]);
  // Videolar + YouTube linkleri tek galeride.
  assert.deepEqual(out.video_urls, ["https://v/1.mp4", "https://youtu.be/x"]);
  // youtube_url boşken ilk youtube_links kullanılır.
  assert.deepEqual(out.links, {
    instagram: "https://instagram.com/x",
    spotify: "https://open.spotify.com/artist/0TnOYISbd1XYRBk9myaseg",
    youtube: "https://youtu.be/x",
    soundcloud: "https://soundcloud.com/x",
    website: "https://x.com",
  });
  assert.equal(out.spotify_artist_id, "0TnOYISbd1XYRBk9myaseg");
});

test("e-posta ve telefon ASLA taşınmaz", () => {
  const out = djProfileToArtistProfile(
    { ...baseDj, email: "gizli@x.com", phone: "05551112233" },
    { entityId: "22222222-2222-2222-2222-222222222222", slug: "dj-kayseri" }
  );
  const serialized = JSON.stringify(out);
  assert.equal(serialized.includes("gizli@x.com"), false);
  assert.equal(serialized.includes("05551112233"), false);
  assert.equal("email" in out, false);
  assert.equal("phone" in out, false);
});

test("boş başvuruda güvenli varsayılanlar", () => {
  const out = djProfileToArtistProfile(baseDj, {
    entityId: "22222222-2222-2222-2222-222222222222",
    slug: "dj-kayseri",
  });
  assert.deepEqual(out.genres, []);
  assert.deepEqual(out.photo_urls, []);
  assert.deepEqual(out.video_urls, []);
  assert.deepEqual(out.links, {});
  assert.equal(out.photo_url, null);
  assert.equal(out.bio, null);
  assert.equal(out.city, null);
  assert.equal(out.spotify_artist_id, null);
});
