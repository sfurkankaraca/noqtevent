# noqta.club — Magazine Content Plan

> Status: v1 (2026-07-22). Editorial plan for the magazine pillar of noqta.club (see PRODUCT_VISION.md §4.2).
> Launch surface: `https://www.noqta.club/blog` ("Journal" — online elektronik müzik dergisi) . Articles live in `~/noqt/noqta/web` (github `sfurkankaraca/Furkan`, main → auto-deploy): `lib/blog/registry.ts` + `components/blog/articles/*.tsx`; this repo's `scripts/seed-club-journal.ts` is the content source of record. Do NOT publish these on noqt.events — brand boundary (PRODUCT_VISION.md §4).

## Editorial identity

A new-generation Turkish-language digital magazine for the electronic music world. Not a translated news feed: original guides, interviews and scene coverage with a point of view. Long-form evergreen guides drive SEO; interviews and scene pieces drive brand and sharing.

## Categories (live at noqta.club/blog)

| Category | Slug | Purpose |
|---|---|---|
| Haberler & duyurular | `haber` | Scene news, releases, noqta announcements — freshness signal for SEO, return visits |
| Efsaneler | `efsaneler` | Portraits of electronic music legends — evergreen, high-authority, strong internal linking |
| Sahne & kültür | `sahne` | Local scene, venues, festivals, genre history |
| DJ & performans | `dj` | Beginner-to-pro DJ guides — SEO engine and DJ Academy funnel |
| Prodüksiyon | `produksiyon` | Music production guides |
| Booking / Eğitim / B2B | `booking` `egitim` `b2b` | Pre-existing commercial clusters |

### Haberler & duyurular — editorial workflow (category is wired, content pending)

News must be **verified before publishing** — never generate news from memory. Sustainable sources: RA/Mixmag/DJ Mag (as sourced commentary, not translation), label and artist announcements, venue/collective Instagram, Bandcamp/Beatport release pages, noqta's own Academy/event announcements. Practical cadence: one monthly "scene roundup" (events + releases) plus ad-hoc announcements. Each item: what happened, why it matters, link to source.

### Efsaneler — how to extend
One portrait per legend, ~1000 words: origin story → key works → influence → "nereden başlamalı" listening list. Always cross-link to related genre/scene articles. Published: Kraftwerk, Frankie Knuckles, Belleville Three, Jeff Mills, Daft Punk, Carl Cox. Backlog: Larry Levan, Underground Resistance, Aphex Twin, Giorgio Moroder, Nina Kraviz, Sven Väth, Türkiye'den isimler.

## Cadence (sustainable launch tempo: 2/week)

- Evergreen guide: 1/week
- Interview: 1 per 2 weeks
- Monthly scene roundup (events + releases): 1–2/month
- Newsletter: weekly, distributes everything
- Short video cuts: 2–3 per interview
- Podcast: starts only after 8–10 interviews exist

## Content sources

1. **Own ecosystem (primary, uncopyable):** NOQT roster artists and events → interviews, backstage stories.
2. **Own expertise:** DJ Academy curriculum knowledge → guides.
3. **External (secondary):** RA/Songkick/venue announcements → event roundups; Bandcamp/Beatport/SoundCloud → Turkish release roundups; international press → commentary (never translation).

## Launch batch (published on noqta.club 2026-07-22) — 10 articles

| # | Slug | Category | Target query |
|---|---|---|---|
| 1 | dj-nasil-olunur-2026-rehberi | DJ'lik | "dj nasıl olunur" |
| 2 | baslangic-icin-dj-controller-onerileri | DJ'lik | "dj controller önerileri / başlangıç dj setup" |
| 3 | rekordbox-serato-traktor-karsilastirmasi | DJ'lik | "rekordbox mu serato mu" |
| 4 | beatmatching-nedir-nasil-ogrenilir | DJ'lik | "beatmatching nedir" |
| 5 | ilk-dj-setini-hazirlama-rehberi | DJ'lik | "dj seti nasıl hazırlanır" |
| 6 | muzik-produksiyonuna-nereden-baslanir | Prodüksiyon | "müzik prodüksiyonu nasıl yapılır" |
| 7 | ableton-mu-fl-studio-mu | Prodüksiyon | "ableton mu fl studio mu" |
| 8 | house-techno-melodic-techno-farklari | Sahne & Kültür | "house techno farkı" |
| 9 | istanbulda-elektronik-muzik-mekanlari | Sahne & Kültür | "istanbul elektronik müzik mekanları" |
| 10 | turkiyede-elektronik-muzik-festivalleri | Sahne & Kültür | "türkiye elektronik müzik festivalleri" |

## Backlog (next 16, weekly cadence)

DJ'lik: mix geçiş teknikleri; EQ ve filtre kullanımı; müzik kütüphanesi düzenleme (cue, grid, playlist); harmonic mixing / Camelot wheel; ilk gig'e hazırlık; DJ'ler için networking (booking nasıl alınır); sahne adı ve marka kurma.

Prodüksiyon: mastering nedir, ne zaman gerekir; sample pack ve ses tasarımı temelleri; ilk track'i bitirme (arrangement); sidechain compression; release nasıl yapılır (distro, label, Bandcamp).

Sahne & Kültür: techno'nun tarihi (Detroit→Berlin→İstanbul); Türkiye elektronik müzik tarihine bakış; kulüp adabı (dansçı gözüyle); Ankara & İzmir sahne rehberi.

## Rules

- Every article ≥ 1000 words, original, experience-based, no thin listicles.
- One H1 (title), H2/H3 structure, internal links between cluster articles.
- CTA at article end points to DJ Academy interest form (once it exists) — until then, generic NOQT CTA.
- Interviews are for reach, guides are for search: do not judge interviews by SEO metrics.
