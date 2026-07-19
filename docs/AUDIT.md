# NOQT Repository Audit

> Date: 2026-07-19. Source of truth for target state: `PRODUCT_VISION.md`, `SOFTWARE_ARCHITECTURE.md`, `INTERACTION_ONTOLOGY.md`.
> Scope: read-only audit of this repository (the future noqt.events product). No code was modified.

## 1. Current Architecture

Single Next.js 16 (App Router) / React 19 monolith deployed on Vercel, serving four audiences from one codebase: public marketing/booking site, admin back office (`/admin`), artist dashboard (`/dj/dashboard`), and token/slug-based client pages (`/teklif`, `/davetiye`, `/memory`, `/planlama`, `/degerlendirme`, `/s`, `/teslimat`).

- **Data:** Supabase Postgres, accessed exclusively via service-role key (`src/lib/supabase.ts:createServiceClient`); the anon client export is unused.
- **Auth:** Clerk; route gating in `src/proxy.ts`; admin = email allowlist (`src/lib/adminAuth.ts`); artist = email match against `dj_profiles` (`src/lib/artistAuth.ts`).
- **Storage:** Supabase Storage (images/audio) + Cloudflare R2 (video/large media) behind SSRF-hardened proxy routes (`/api/media/[...path]`, `/api/video`, `/api/download`).
- **Payments:** iyzico with server-to-server verification (`src/app/api/payment/iyzico/callback/route.ts`).
- **Email:** Resend via one monolithic template file (`src/lib/email.ts`, 1136 lines).
- **AI:** Vercel AI Gateway (`src/lib/aiContent.ts` — claude-sonnet-5 text, imagen image), admin-only endpoints.
- **PDF:** `@react-pdf/renderer` subsystem (`src/lib/generate*Pdf.tsx`) — contract, offer, project file, run sheet.
- **Writes:** two parallel patterns chosen ad hoc — Server Actions (`**/actions.ts`) and Route Handlers (`src/app/api/**`).
- **Not present:** fact log, entity registry, intelligence boundary (all Day-1 targets per `SOFTWARE_ARCHITECTURE.md` §3), chat, ticketing, graph anything.

## 2. Folder Structure

```
src/app/                  routes (public TR-named pages, admin/**, api/**, token pages)
src/components/
  admin/ artist-booking/ davetiye/ home/ layout/ planner/ sections/ ui/ (shadcn)
src/lib/                  34 flat files: auth, domain logic, infra clients, PDF, email — no submodules
src/proxy.ts              Clerk middleware
supabase-*.sql (repo root) 37 unordered schema/migration/seed files, applied manually
docs/                     foundation documents (this audit lives here)
```

Key structural issue: `src/lib` mixes platform concerns (supabase, r2, rateLimit), product domain logic (bookingTerms, paymentPlan, checklistTemplate), and rendering (PDF, email) in one flat namespace — the opposite of the module layout mandated by `SOFTWARE_ARCHITECTURE.md` §2.1.

## 3. Database Tables (reconstructed from the 37 SQL files)

| Cluster | Tables |
|---|---|
| Booking commerce | `bookings`, `booking_payments` (+invoicing cols), `booking_agreements`, `booking_items` |
| Planning/execution | `event_projects`, `checklist_items`, `checklist_comments`, `event_schedule_items` |
| Demand intake | `inquiries`, `contact_messages` |
| Supply | `dj_profiles` (heavily extended: rider, presskit, photos, busy_dates…), `partner_profiles` (+`tool_data` toolkit) |
| Catalog/content | `concepts`, `packages`, `pricing_tiers`, `pricing_factors`, `pricing_faq`, `songs`, `journal_posts`, `site_assets`, `testimonials` |
| Davetiye module | `invitations`, `rsvp_responses` |
| Memory Drive module | `memory_events`, `memory_uploads` |
| Internal ops | `company_goals`, `company_tasks`, `company_task_completions` |

Known schema problems: two half-linked event models (`bookings` ↔ `event_projects` via nullable FK); `checklist_items`/`checklist_comments` serve both parents via nullable FKs; **RLS policies missing `TO service_role` grant public anon read/write** on `songs`, `inquiries`, `dj_profiles`, `partner_profiles`, `site_assets`, `invitations`, `rsvp_responses`, `memory_events`, `memory_uploads` (`supabase-schema.sql:87-112`, `supabase-davetiye.sql:60-67`, `supabase-memory.sql:44-48`). Later tables (`bookings`, `booking_*`, `testimonials`, `contact_messages`) are RLS-enabled with no policy = correctly deny-all.

## 4. API Routes (34 handlers)

| Group | Routes | Guard |
|---|---|---|
| Admin ops | `/api/admin/{finans/export, youtube-auth, drive-to-youtube, memory-to-youtube, artist-video-to-youtube}` | `isAdmin` |
| Bookings | `/api/bookings/[id]/{contract, project-file, checklist, checklist/comments}` | `isAdmin` |
| Event projects | `/api/event-projects`, `/api/event-projects/concept-suggest`, `/api/event-projects/[id]/{ai, checklist, checklist/comments, schedule, run-sheet, project-file}` | `isAdmin` |
| Offer/contract | `/api/teklif/[slug]/{pdf, sozlesme}` | rate-limit (public by design) |
| Payment | `/api/payment/iyzico/callback` | server-side iyzico verification (correct) |
| Memory Drive | `/api/memory/{upload, upload-url, confirm, notify, download-all}` | rate-limit (public by design) |
| Intake | `/api/basvuru`, `/api/basvuru/partner`, `/api/rsvp` | rate-limit |
| Upload | `/api/upload`, `/api/upload-url` | `isAdmin` + rate-limit |
| Media proxies | `/api/media/[...path]`, `/api/video`, `/api/download` | host-allowlist only, no auth/limit (unmetered bandwidth) |
| Cron | `/api/cron/{payment-reminders, review-requests}` | `CRON_SECRET` header |
| **Anomaly** | `/api/admin/apply-rider-templates` | **hardcoded bearer token in source (line 7); self-described temporary; currently untracked** |

## 5. Authentication Flow

1. `src/proxy.ts` (Clerk middleware) protects `/admin(.*)`, `/dj/dashboard(.*)`, and `/partner/dashboard(.*)` (dead — route doesn't exist).
2. Admin: `isAdmin()` compares Clerk user emails to `ADMIN_EMAILS` env (hardcoded fallback `karaca3888@gmail.com` in `src/lib/adminAuth.ts:3`). Every admin server action must call `requireAdmin()` manually (discipline-based, correctly followed today).
3. Artist: `getMyArtistProfile()` matches Clerk email to `dj_profiles.email` — no FK to Clerk userId.
4. Client-facing pages authenticate by unguessable slug/token (`offer_slug`, `checklist_token`, `delivery_slug`, memory slug + optional password), not by login.
5. Per the foundation docs, this entire email-matching model is slated for replacement by the platform Identity spine (entity registry + roles) — see `INTERACTION_ONTOLOGY.md` §3.2 migration note.

## 6. Shared Components

- **UI primitives:** `src/components/ui/*` (12 shadcn components) — future design-system package per `SOFTWARE_ARCHITECTURE.md`.
- **Layout:** `Navigation`, `Footer`, `WhatsAppButton` — shared across all public pages including Davetiye/Memory Drive landings.
- **Cross-feature:** `RiderBuilder` (admin + artist dashboard), `FocalPointPicker` (DJ + partner forms), `PrintButton`.
- **Shared libs (future platform-package candidates):** `supabase.ts`, `r2.ts`, `media.ts`, `rateLimit.ts`, `email.ts`, `aiContent.ts`, PDF subsystem, `pdfFonts.ts` (331KB embedded base64), `pdfLogo.ts`.

## 7. Dead Code

| Item | Evidence |
|---|---|
| `/partner/dashboard` protected matcher — no such route exists | `src/proxy.ts:6` |
| `supabase` anon-client export — zero importers | `src/lib/supabase.ts:6`; grep confirms no `import { supabase }` anywhere |
| `/api/admin/apply-rider-templates` — self-described "delete after running" temporary endpoint, with hardcoded token | `src/app/api/admin/apply-rider-templates/route.ts:1-7` (untracked) |
| Duplicate admin trees `/admin/ortaklar/**` and `/admin/partnerler/**` — both CRUD the same `partner_profiles` table | both `actions.ts` files write `partner_profiles`; one tree is redundant |
| Root-level stray files: `Emre_Zehra_Evlilik_Yeterlilik_Sinavi.pdf` (personal PDF), `tsconfig.tsbuildinfo` (build artifact, 790KB) | repo root |

Not dead (verified): `seedPosts.ts` (used by journal admin), `homeFaq.ts`, `eventPages.ts`.

## 8. Product Ownership Mapping (per PRODUCT_VISION.md)

**noqt.events (this repo — everything currently live):**
- All booking commerce, planning/execution, intake, supply, catalog, pricing, offer/contract/payment flows, admin console, artist dashboard, presskit, partner ecosystem, reviews, cron jobs.
- **Davetiye module** (`/davetiye`, `/dijital-davetiye`, `invitations`, `rsvp_responses`, `src/components/davetiye/**`) — stays per founder decision; keep its table/route independence intact for possible later separation.
- **Memory Drive module** (`/memory`, `/memory-drive`, `memory_events`, `memory_uploads`) — same status.
- Company Cockpit (`/admin/hedefler`, `company_*` tables) — internal tool, fully isolated.

**NOQT Social (second product, to be built as a new app):**
- **Nothing in this repo belongs to it today.** Relevant only as future consumers/patterns: `concepts` taxonomy and planner UX patterns may inform discovery; public-event/ticketing tables must be built new in Social's own database (never added here — `PRODUCT_VISION.md` §4.3 boundary).

**noqta.club (third product, later):**
- **No code belongs to it yet.** The **Journal** (`journal_posts`, `/journal`, `/admin/journal`, `seedPosts.ts`) is the one existing asset that thematically matches noqta.club's media mission — but it currently functions as noqt.events SEO. Flag: content-ownership decision needed when noqta.club is built (migrate vs. duplicate-purpose). `songs` and `concepts` knowledge may later feed academy curriculum; no action now.

## 9. Biggest Technical Debt (ranked)

1. **RLS public-write exposure** on nine tables (see §3) — live external risk; fix is planned in `SOFTWARE_ARCHITECTURE.md` §4 step 1, **implementation awaiting founder go-ahead**.
2. **No migration tooling** — 37 unordered SQL files; already forcing "column may not exist" retry code into payment/contract flows (`iyzico/callback/route.ts:46,86`, `teklif/[slug]/actions.ts:113-116`).
3. **Dual event model** (`bookings` vs `event_projects`) — blocks the shared Event primitive and clean fact emission (`booked`, `hosted`, `performed_at` need one authoritative lifecycle).
4. **Ad-hoc email-matching identity**, duplicated twice, no Clerk-ID linkage — blocks the Identity spine, the tripod's load-bearing leg.
5. **Hardcoded secret** in `apply-rider-templates/route.ts:7` + recurring "temporary endpoint" pattern (git history: `84c8461`, `8f001f6`, `2aef508`).
6. Monoliths within the monolith: `email.ts` (1136), `PlannerStore.ts` (1206), `pdfFonts.ts` (331KB base64).
7. In-memory rate limiter — ineffective across serverless instances.
8. Two write patterns (Server Actions vs Route Handlers) with no rule for choosing.
9. Duplicate partner admin trees; dead route matcher; unused anon export.

## 10. First Migration Candidates (aligned to SOFTWARE_ARCHITECTURE.md §4; all awaiting go-ahead)

1. **Step 1 — security batch (same-day):** RLS `TO service_role` fixes; delete `apply-rider-templates` endpoint and rotate its token; remove dead `/partner/dashboard` matcher; remove unused anon export. *Blocked only by founder authorization.*
2. **Step 2 — migration tooling:** Supabase CLI baseline snapshot; retire the 37 root SQL files.
3. **Step 3 — identity + fact log foundations:** entity registry + role table seeded from Clerk users/`dj_profiles`/`partner_profiles`; fact table with the §2 envelope; emission wired into booking-confirmed / payment-completed / review-submitted paths. *Vocabulary is DRAFT — requires founder review pass before facts are emitted (`INTERACTION_ONTOLOGY.md` header).*
4. **Step 4 — opportunistic modularization:** `src/lib` → `booking-event/`, `davetiye/`, `memory-drive/`, `platform/` as files are touched; merge the duplicate partner admin trees.
5. **Step 5 — event-model unification:** merge `bookings`+`event_projects` behind the existing API surface; prerequisite for the shared Event primitive and full fact emission.
6. **Step 6 trigger:** NOQT Social kickoff (new app, new DB) — the point where Identity becomes a real service and the design system/shared packages get extracted.
