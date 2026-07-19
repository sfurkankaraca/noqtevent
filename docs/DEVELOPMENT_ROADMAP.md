# NOQT — Development Roadmap

> Date: 2026-07-19. Derived strictly from `PRODUCT_VISION.md`, `SOFTWARE_ARCHITECTURE.md` (§3 Day 1 / §4 migration), `INTERACTION_ONTOLOGY.md` (§12 Day 1 scope) and `AUDIT.md` (§9 debt / §10 candidates). No new design decisions are introduced here.
> Every milestone is sized 1–3 days and ordered by dependency. Types: **Foundation** (platform assets per the docs), **Refactor** (structure without behavior change), **Feature** (new user-facing capability), **Infrastructure** (tooling/ops).

## Gates (founder approvals that block milestones)

| Gate | Blocks | Status |
|---|---|---|
| **G1 — Implementation go-ahead** for security fixes / code changes (`SOFTWARE_ARCHITECTURE.md` §4 status note) | M2 and everything after it | ✅ **OPENED 2026-07-19** — founder authorized M2 |
| **G2 — Vocabulary review pass** (`INTERACTION_ONTOLOGY.md` header) | M6 (fact emission) | ✅ **CLOSED 2026-07-19** — M1 executed and founder-approved |
| **G3 — NOQT Social kickoff** (second product, founder decision) | M12–M14 | ⏳ pending |

## Dependency order

```
M1 → [satisfies G2]
G1 → M2 → M3 → M4 → M5 → M6 → M7
              M3 → M8 → M9 → M10 → M11a → M11b
                                   G3 → M12 → M13 → M14
```

---

## M1 — Vocabulary review session · **Foundation** · 1 day · satisfies G2

- **Goal:** Founder review pass over the DRAFT vocabulary: 23 verbs, 8 contexts, emission thresholds, visibility floors (`INTERACTION_ONTOLOGY.md` §5–§7). Output is doc edits + changelog entry flipping status from DRAFT to ratified.
- **Files affected:** `docs/INTERACTION_ONTOLOGY.md` only.
- **Risks:** scope creep back into strategy discussion — mitigated: review accepts/edits/rejects existing entries only; new concepts go through §13 governance later.
- **Success criteria:** header DRAFT note replaced; §13 changelog has a ratification entry; every kept verb has an approved emission trigger.
- **Status: ✅ COMPLETED & FOUNDER-APPROVED 2026-07-19.** Result: Day 1 = 6 verbs (`booked`, `purchased`, `cancelled`, `performed_at`, `hosted`, `reviewed`) + 4 contexts (`wedding`, `corporate`, `social-celebration`, `nightlife`); `rated` merged into `reviewed`; `supplied` deferred until partner references exist; `hosted` actor = booking client/event owner; 16 verbs + 4 contexts Deferred with reasons. **Gate G2 closed.**

## M2 — Security batch · **Foundation** · 1 day · gated by G1

- **Goal:** Close the live external risks identified in `AUDIT.md` §9.1/§9.5 without touching behavior: add `TO service_role` to (or drop) the permissive RLS policies on the nine exposed tables; delete the temporary `apply-rider-templates` endpoint and rotate its token; remove the dead `/partner/dashboard` matcher; remove the unused anon `supabase` export.
- **Files affected:** new SQL (RLS fix) applied to Supabase; `src/app/api/admin/apply-rider-templates/` (delete); `src/proxy.ts`; `src/lib/supabase.ts`.
- **Risks:** an RLS policy the app silently relied on via anon key — mitigated: audit verified zero anon-client call sites; deploy + smoke-test public pages (`/`, `/davetiye/[slug]`, `/memory/[slug]`, `/teklif/[slug]`) after applying.
- **Success criteria:** anon-key REST calls to `dj_profiles`, `inquiries`, `invitations`, `memory_uploads` etc. return zero rows / permission errors; all public pages still render; endpoint gone from repo; Vercel deploy Ready.
- **Status: ✅ CODE COMPLETE 2026-07-19** (implementation executed; SQL fix and deploy verification pending founder action outside this session — see notes below).
  - Scope correction from `AUDIT.md`: `dj_profiles`/`partner_profiles` were re-verified during execution and found **already correctly scoped** (filtered public read, filtered pending-only insert) — excluded from the SQL fix. The actual unrestricted-policy set is 7 tables, not 9: `songs`, `inquiries`, `site_assets`, `invitations`, `rsvp_responses`, `memory_events`, `memory_uploads`.
  - Delivered: `supabase-migration-security-anon-lockdown.sql` (new — restricts the 7 policies to `TO service_role`; not yet applied to live Supabase, run manually via Dashboard per existing project convention); `src/app/api/admin/apply-rider-templates/` deleted (confirmed dead — the live admin feature uses the separate, correctly `requireAdmin()`-guarded `applyRiderTemplateToAll` Server Action in `src/app/admin/djler/actions.ts`, not this route); `/partner/dashboard` matcher removed from `src/proxy.ts`; unused anon `supabase` export removed from `src/lib/supabase.ts` (zero importers, verified).
  - Build verified: `next build` compiles successfully with these changes; a pre-existing, unrelated local env-loading failure at the static-generation stage was confirmed (via `git stash` A/B test) to exist on `main` **before** this milestone — not a regression.
  - **Outstanding, outside this session's scope:** run the new SQL file against live Supabase, then smoke-test the four public pages and confirm Vercel deploy Ready, per the success criteria above.

## M3 — Migration tooling baseline · **Infrastructure** · 1–2 days

- **Goal:** Adopt Supabase CLI migrations; snapshot the current live schema as the baseline migration; retire the 37 root `supabase-*.sql` files (move to `docs/legacy-sql/` until verified, then delete). All future schema changes go through tooling only.
- **Files affected:** new `supabase/migrations/0000_baseline.sql`; root `supabase-*.sql` files (moved); `AUDIT.md` note updated.
- **Risks:** baseline diverging from actual live schema (the files were applied manually and partially) — mitigated: generate baseline by introspecting the live database, not by concatenating the files.
- **Success criteria:** `supabase db diff` against live returns empty; a trivial test migration applies and rolls forward cleanly; repo root has no loose SQL.

## M4 — Entity registry + roles · **Foundation** · 2 days

- **Goal:** Create the platform entity registry and role table (`INTERACTION_ONTOLOGY.md` §3); seed from existing data: Clerk users → `person`, `dj_profiles` → person + `artist` role, `partner_profiles` → organization/venue + `partner` role. Read-only alongside existing tables — no product code switches to it yet.
- **Files affected:** new migration (via M3 tooling); new `src/lib/platform/entities.ts` (or equivalent seed/lookup helpers); one-off seed script under `scripts/`.
- **Risks:** duplicate humans (same person as Clerk user and DJ email) — mitigated: seed matches on lowercased email and records unmatched rows for manual review rather than guessing.
- **Success criteria:** every active `dj_profiles`/`partner_profiles` row and Clerk user maps to exactly one entity; unmatched list reviewed; no product behavior change.

## M5 — Fact log table + validation · **Foundation** · 1–2 days

- **Goal:** Create the fact table with the §2 envelope; implement the single emission function enforcing the seven validation rules (§11), including DB-level append-only enforcement (no UPDATE/DELETE grants outside the redaction path) and the tombstone redaction function (§10).
- **Files affected:** new migration; new `src/lib/platform/facts.ts` (emit + validate + redact).
- **Risks:** none to product behavior (nothing calls it yet); design risk if envelope changes post-G2 — mitigated: M5 starts after M1 concludes.
- **Success criteria:** unit-level checks pass: unregistered verb rejected, `matched` without context rejected, visibility floor enforced, UPDATE/DELETE denied at DB level, redaction produces a tombstone.

## M6 — Fact emission wiring · **Foundation** · 2–3 days · gated by G2

- **Goal:** Emit facts from existing noqt.events transaction points per §12, **Day 1 set only (M1 result)**: booking confirmed → `booked`; iyzico payment completed → `purchased`; review submitted → `reviewed` (rating in metadata); booking completed → `performed_at` + `hosted`; cancellation → `cancelled`. Context mapped from `bookings.event_type` onto the 4 Day 1 contexts (null if unmappable). Emission lives inside the transaction-completion functions, not per-feature code.
- **Files affected:** `src/app/teklif/[slug]/actions.ts`; `src/app/api/payment/iyzico/callback/route.ts`; `src/app/degerlendirme/[slug]/actions.ts`; `src/app/admin/bookings/actions.ts` (status transitions); `src/lib/platform/facts.ts`.
- **Risks:** touching the payment callback (highest-blast-radius file) — mitigated: emission is fire-and-forget after the existing logic, failures logged and never thrown into the payment path; test against iyzico sandbox.
- **Success criteria:** a full offer→payment flow produces the expected fact rows with correct context/visibility; payment flow behavior byte-identical on failure of emission; the moat starts accumulating.

## M7 — Intelligence boundary · **Foundation** · 1 day

- **Goal:** Create the `intelligence.*` interface (`SOFTWARE_ARCHITECTURE.md` §2 diagram): `recommend()` / `match()` functions as the only fact-log readers. v1 implementations: wrap the existing tag-intersection DJ matching and LLM concept suggestion behind it; SQL over facts where useful. Products stop the (future) habit of querying facts directly before it starts.
- **Files affected:** new `src/lib/intelligence/index.ts`; `src/components/planner/steps/Step9Recommendations.tsx` callers unchanged for now (client-side filter stays until a server pass); `src/app/api/event-projects/concept-suggest/route.ts` re-pointed through the boundary.
- **Risks:** over-building — mitigated: interface + thin wrappers only, no new algorithms (per ADR-6 and the §3 "hand-curation beats models" note).
- **Success criteria:** concept-suggest works identically through the boundary; grep shows no fact-table reads outside `src/lib/intelligence/`.

## M8 — Modularize platform libs · **Refactor** · 1–2 days

- **Goal:** Move infra-flavored `src/lib` files into `src/lib/platform/` (supabase, r2, media, rateLimit, email, aiContent, pdfFonts, pdfLogo) per the §2.1 module layout. Import-path change only; zero behavior change.
- **Files affected:** ~10 files moved under `src/lib/platform/`; import updates across `src/app/**` and `src/components/**`.
- **Risks:** broken imports — mitigated: TypeScript build catches all; do in one commit; no logic edits allowed in the same commit.
- **Success criteria:** `next build` passes with dummy env (per project verification practice); `git diff` shows only moves/imports.

## M9 — Modularize product modules · **Refactor** · 2 days

- **Goal:** Group product domain code into modules: `src/lib/booking-event/` (bookingTerms, paymentPlan, bookingItems, contract, offerPdf, offerOtp, checklistTemplate, eventPages…), `src/lib/davetiye/`, `src/lib/memory-drive/` — preserving Davetiye/Memory Drive separability (founder decision, `PRODUCT_VISION.md` §8).
- **Files affected:** remaining `src/lib/*` files moved; imports updated.
- **Risks:** same as M8; slightly higher surface — same mitigations.
- **Success criteria:** build passes; `src/lib` root contains only `utils.ts` and module folders; no cross-module imports except via platform.

## M10 — Merge duplicate partner admin trees · **Refactor** · 1 day

- **Goal:** Consolidate `/admin/ortaklar/**` and `/admin/partnerler/**` (both CRUD `partner_profiles` — `AUDIT.md` §7) into one tree; redirect or delete the other.
- **Files affected:** `src/app/admin/partnerler/**` or `src/app/admin/ortaklar/**` (one deleted), `src/app/admin/AdminSidebar.tsx`.
- **Risks:** the two forms have drifted (different field coverage) — mitigated: diff both forms first, keep the superset.
- **Success criteria:** one admin tree edits all partner fields previously editable in either; sidebar has one entry; build passes.

## M11a — Event-model unification: schema · **Refactor** · 2–3 days

- **Goal:** Design + migrate `bookings` + `event_projects` into one lifecycle model with commercial facts structurally separated from event facts (`SOFTWARE_ARCHITECTURE.md` §4.5, ADR-7 prerequisite). Data migration via M3 tooling; old tables kept as views or read-compat during M11b.
- **Files affected:** new migrations; `docs/SOFTWARE_ARCHITECTURE.md` decision-record addition documenting the final shape.
- **Risks:** live bookings corrupted — mitigated: migrate behind existing API surface; dry-run against a branch database; keep reversible compat views until M11b completes.
- **Success criteria:** every existing booking and event project representable in the unified model with zero data loss (row-count + field checksums); app still runs on compat layer.

## M11b — Event-model unification: code switch · **Refactor** · 2–3 days

- **Goal:** Point booking admin, event-project admin, checklist/run-sheet APIs and fact emission at the unified model; drop compat views; `checklist_items` gets a single non-nullable parent.
- **Files affected:** `src/app/admin/bookings/**`, `src/app/admin/etkinlikler/**`, `src/app/api/event-projects/**`, `src/app/api/bookings/**`, `src/lib/booking-event/**`.
- **Risks:** widest-touch milestone in the roadmap — mitigated: sequenced after modularization (M8–M9) so touch points are consolidated; full manual pass over admin flows + one live-like offer flow before deploy.
- **Success criteria:** `event_projects`/compat views dropped; all admin and client flows verified; `hosted`/`performed_at` facts emitted from the unified lifecycle.

## M12 — Identity as a real service + workspace extraction · **Infrastructure** · 2–3 days · gated by G3

- **Goal:** At NOQT Social kickoff (ADR-3, §4.6): promote the entity registry to an independently consumable Identity service; choose workspace/monorepo tooling (open decision §8); extract design system (`src/components/ui`) and platform packages for consumption by the second app.
- **Files affected:** repo restructure into workspace; new identity service surface; `package.json` topology.
- **Risks:** tooling decision made under time pressure — mitigated: it's an explicitly deferred open decision; decide at the start of this milestone, document as an ADR.
- **Success criteria:** noqt.events builds and deploys unchanged from the workspace; a second app can authenticate a user and resolve entities/roles without importing noqt.events code.

## M13 — NOQT Social scaffold · **Feature** · 2–3 days · gated by G3

- **Goal:** New app, **new separate database** (founder decision), consuming Identity, design system and fact log from day one. Scaffold only: auth, profile shell, entity-linked social profile — no matching/communities/ticketing yet.
- **Files affected:** new app workspace (outside this product's code); new Social database migrations.
- **Risks:** boundary erosion (reaching into noqt.events data) — mitigated: anti-coupling rules (§2.2) enforced from the first commit; reference by entity ID only.
- **Success criteria:** a user signs in to Social with the same identity that exists in noqt.events; zero imports from noqt.events product modules; separate DB confirmed.

## M14 — Social event discovery + first facts · **Feature** · 2–3 days · gated by G3, after M13

- **Goal:** First real Social capability per `PRODUCT_VISION.md` §4.3: public-event listing (Social-owned tables, extending the shared Event primitive) and `attended`/`saved`/`viewed` fact emission — beginning the participation stroke of the flywheel.
- **Files affected:** Social app + its migrations; shared Event-primitive schema (this triggers filling `INTERACTION_ONTOLOGY.md` §4, the reserved object-extension spec).
- **Risks:** scope pull toward ticketing/matching — mitigated: listing + facts only; ticketing is a later milestone defined when this one completes.
- **Success criteria:** a public event created in Social is discoverable; attendance produces correct facts; noqt.events remains untouched.

---

## Explicitly out of roadmap scope (deferred per the foundation docs)

Graph database · trust/reputation scoring · embeddings/ML · chat/messaging infrastructure · confidence-scored inferences · payments/media/notifications as deployed services · noqta.club (follows after Social — no milestones defined until its kickoff gate exists) · durable rate limiting and `email.ts` split (worthwhile refactors; schedule opportunistically, they block nothing above).
