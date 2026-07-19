# NOQT — Interaction Ontology

> Status: Foundation document, v1 (2026-07-19). This is the canonical language for the interaction fact log — the company's compounding asset (see `PRODUCT_VISION.md` §2).
>
> **Vocabulary status (founder decision 2026-07-19): the 23 verbs, 8 contexts and all emission thresholds in this document are a DRAFT vocabulary, not an approved implementation contract.** The envelope structure (§2), design principles (§1), visibility model (§7) and privacy rules (§10) are ratified; the concrete verb/context/threshold lists require a founder review pass before any code emits facts against them.
>
> Governance: changes to entity kinds, verbs, contexts, or visibility classes require an entry in this file's changelog (§13) and founder sign-off. Products may NOT invent canonical vocabulary in feature branches.

## 1. Design Principles

1. **Universal grammar, governed vocabulary.** One fixed envelope for every fact in every product; a small closed registry of business-meaningful verbs. Not a minimal universal ontology (too lossy — `connected_with` erases the signal recommenders need), not free product dialects (ungovernable — the `bookings`/`event_projects` split reproduced at the semantic layer).
2. **Facts, not states.** The log records irreversible past-tense occurrences. Current status lives in product transactional tables. A cancelled booking emits a new `cancelled` fact; the original `booked` fact is never touched.
3. **Append-only.** Facts are never updated or deleted (exception: §10 redaction tombstones). If someone proposes updating a fact row, the design has failed.
4. **Facts downstairs, beliefs upstairs.** Everything in the log has confidence 1.0 by construction (it happened). Inferred relationships with confidence scores live in the intelligence layer, derived and disposable — never in the log.
5. **Verb altitude test:** would a recommender ever want to treat two candidate verbs differently? Yes → keep separate. No → merge.
6. **Documentation + validation, not machinery.** This ontology is a markdown spec plus a validation function. No RDF, no triple store, no OWL inference, no ActivityStreams runtime (steal its actor/verb/object shape; ignore its machinery).

## 2. The Fact Envelope

Every fact, every product, no exceptions:

```
fact (
  id              uuid,
  actor_entity_id uuid       NOT NULL,  -- who did it (entity registry)
  verb            text       NOT NULL,  -- from §6 registry (or namespaced, §8)
  object_entity_id uuid      NOT NULL,  -- what it was done to (entity registry)
  context         text       NULL,      -- from §5 taxonomy
  occurred_at     timestamptz NOT NULL, -- when it happened (not when logged)
  product_source  text       NOT NULL,  -- 'events' | 'club' | 'social'
  visibility      text       NOT NULL,  -- from §7
  metadata        jsonb      DEFAULT '{}'  -- verb-specific detail (e.g. rating value)
)
```

Notes:
- **No `confidence` column** — deliberately excluded (ADR-10 in `SOFTWARE_ARCHITECTURE.md`).
- `metadata` is for verb-specific structured detail; it must never carry message content, free-text personal data, or anything needed for cross-product queries (if a query needs it, it belongs in the envelope or the object).
- Actor vs object is a property of the *fact*, not the entity — a venue is object of `visited` and actor of `hosted`.

## 3. Entity Registry

One canonical record per real-world entity, platform-owned, referenced by every product. The registry is one leg of the tripod (Person spine · object registry · fact log) — actions are worthless unless their endpoints stay stable for a decade.

### 3.1 Entity kinds (closed set)

| Kind | Examples | Notes |
|---|---|---|
| `person` | customer, artist-as-human, learner, social user | Special: consent, erasure, auth (§10) |
| `organization` | company client, brand, agency | |
| `venue` | wedding hall, club, hotel | |
| `community` | interest group, cohort, scene | |
| `event` | wedding, corporate night, public party, workshop | Shared primitive; products extend |
| `course` | DJ Academy course, workshop curriculum | |
| `content` | article, podcast episode, video, mix | |

### 3.2 Person and role model

**Artist is not an entity kind. Artist is a role.** The same human is an Artist in noqt.events, an Instructor in noqta.club, a Person in NOQT Social — one `person` entity, multiple role records:

```
role (
  entity_id   uuid,   -- person or organization
  role        text,   -- 'artist' | 'instructor' | 'partner' | 'supplier' | 'organizer' | 'admin'
  product     text,   -- where the role is active
  granted_at  timestamptz,
  metadata    jsonb
)
```

Products own their role *profiles* (e.g., noqt.events' ArtistProfile with rider/presskit data) keyed to the platform entity ID. The registry owns only identity + role existence.

Migration note: today's identity is email-matching (`src/lib/artistAuth.ts`) against `dj_profiles`. Day-1 work maps Clerk users + `dj_profiles` + `partner_profiles` rows onto canonical entities. Long-lived relationships with lifecycle (e.g. brand ↔ organizer `works_with`) are **objects, not verbs**: model as a registry record that emits `partnership_started` / `partnership_ended` facts. Rule: has duration or can end → object; happened at a moment → fact.

## 4. — (reserved)

Section intentionally reserved for an object-extension spec (how products extend `event`/`community` primitives) once the second product is being built. Do not fill speculatively.

## 5. Context Taxonomy (governed, small, nullable)

The same interaction means different things in different contexts; recommenders must treat `matched(dating)` and `matched(professional)` completely differently. Context is first-class in the envelope. Starting set:

| Context | Used by |
|---|---|
| `wedding` | events |
| `corporate` | events |
| `social-celebration` | events (birthday, engagement, private party) |
| `nightlife` | events, social (club, festival, public party) |
| `learning` | club |
| `dating` | social |
| `friendship` | social |
| `professional` | events, club, social (collaboration, mentoring, business) |

Rules:
- Emit context even when derivable from the object (denormalized on purpose — the log must be queryable without joins into product DBs).
- New contexts go through the same governance as verbs (§13). Free-text context is forbidden.

## 6. Governed Verb Registry (canonical, closed)

Each entry: definition + emission trigger. **Every verb needs an emission threshold written down** — the cheap verbs (`viewed`) are the dangerous ones; thresholds are the difference between a graph and a clickstream.

### Presence & experience (weak–medium signal, high volume)

| Verb | Definition | Emission trigger |
|---|---|---|
| `viewed` | Meaningful look at a profile/listing/content | Detail page open ≥3s (not list impressions) |
| `saved` | Bookmarked/favorited for later | Explicit save action |
| `attended` | Was present at an event/workshop (physical or virtual) | Check-in, ticket scan, or organizer confirmation |
| `visited` | Was at a venue outside a formal event | Explicit check-in only (no passive location) |

### Commitment (strong signal, low volume — transaction echoes)

| Verb | Definition | Emission trigger |
|---|---|---|
| `booked` | Commercially engaged a supplier (artist/venue/partner) | Booking reaches confirmed status |
| `purchased` | Bought a product (ticket, invitation, memory drive, course) | Payment completed |
| `enrolled` | Started a course/cohort | Enrollment activated |
| `completed` | Finished a course/cohort | Completion criteria met (separate from `enrolled` — starting and finishing are wildly different signals) |
| `performed_at` | Supplied artistic performance to an event | Event completed with this artist on the bill |
| `supplied` | Provided non-performance service to an event | Event completed with this partner's service delivered |
| `hosted` | Owned/threw the event | Event completed; actor is the event owner |
| `cancelled` | Withdrew from a prior commitment | Booking/enrollment/ticket cancelled (new fact; prior fact untouched) |

### Social

| Verb | Definition | Emission trigger |
|---|---|---|
| `follows` | Persistent asymmetric interest in person/artist/community/brand | Follow action (unfollow emits `unfollowed`) |
| `unfollowed` | Ended a follow | Unfollow action |
| `joined` | Became member of community/group/cohort | Membership activated |
| `matched` | Mutual, consented person↔person connection | Both sides consented; **context required** |
| `messaged` | Initiated first contact / started a thread | First message in a new thread only. **Never log message content or volume** |
| `invited` | Brought someone into an event/community | Invitation sent that was accepted |
| `referred` | Brought a new person into the ecosystem | Referred signup completed (the growth loop, made queryable) |

### Evaluation (sparse, precious)

| Verb | Definition | Emission trigger |
|---|---|---|
| `rated` | Structured score given | Rating submitted; value in `metadata.rating` |
| `reviewed` | Written evaluation given | Review submitted (content stays in product tables; fact records that it happened) |
| `endorsed` | Vouched for a skill/quality of a person | Explicit endorsement action |

### Relationship lifecycle

| Verb | Definition | Emission trigger |
|---|---|---|
| `partnership_started` / `partnership_ended` | Long-running relationship object began/ended (§3.2) | Relationship record created/closed |

## 7. Visibility Taxonomy

Part of the envelope, not an afterthought. Default-deny for cross-product reads.

| Class | Meaning | Cross-product intelligence |
|---|---|---|
| `public` | Publicly observable anyway (public review, public follow) | Readable by default |
| `product-private` | Normal product activity (booking, enrollment, attendance) | Readable only via explicit per-use-case allowlist |
| `sensitive` | Dating/matching and anything intimacy-adjacent | Never readable outside originating product context. `matched(dating)`, `messaged(dating)` are always `sensitive` |

Hard rule: dating-context facts must never influence or surface in professional contexts (artist recommendation, supplier scoring). With one shared log, leakage is the *default* unless designed out — this taxonomy is that design.

## 8. Product-Namespaced Experimental Verbs

Products may emit namespaced verbs freely, without registry approval: `social.super_liked`, `club.streak_kept`, `events.site_visit_scheduled`.

Rules:
- Namespaced verbs use the same envelope and validation.
- Platform-level intelligence **ignores** namespaced verbs until promoted to the canon (§13 governance), at which point historical namespaced facts are backfill-remapped — a cheap migration precisely because the envelope is uniform.

## 9. Examples (one per product)

```jsonc
// noqt.events — a wedding booking is confirmed
{ "actor_entity_id": "<person: bride>", "verb": "booked",
  "object_entity_id": "<person: DJ (role: artist)>", "context": "wedding",
  "occurred_at": "2026-08-02T14:11:00+03:00", "product_source": "events",
  "visibility": "product-private", "metadata": { "booking_id": "…" } }

// noqta.club — a student finishes DJ Academy Level 1
{ "actor_entity_id": "<person: student>", "verb": "completed",
  "object_entity_id": "<course: dj-academy-1>", "context": "learning",
  "occurred_at": "2026-09-15T20:00:00+03:00", "product_source": "club",
  "visibility": "product-private", "metadata": { "certificate_id": "…" } }

// NOQT Social — two people match for dating
{ "actor_entity_id": "<person: A>", "verb": "matched",
  "object_entity_id": "<person: B>", "context": "dating",
  "occurred_at": "2026-10-01T22:30:00+03:00", "product_source": "social",
  "visibility": "sensitive", "metadata": {} }

// NOQT Social — attending a public event (cross-product: event produced by noqt.events)
{ "actor_entity_id": "<person: A>", "verb": "attended",
  "object_entity_id": "<event: warehouse-party-oct>", "context": "nightlife",
  "occurred_at": "2026-10-18T23:00:00+03:00", "product_source": "social",
  "visibility": "product-private", "metadata": { "ticket_id": "…" } }
```

## 10. Privacy, Consent, Deletion & Redaction

- **Persons are special.** Only `person` entities carry consent and erasure rights (KVKK/GDPR). Organizations/venues cannot demand erasure of their edges.
- **Redaction by tombstone**, preserving append-only: on a valid erasure request, person-linked facts are replaced with a tombstone (envelope retained with actor redacted to an anonymous marker, metadata cleared) or fully tombstoned where law requires. Aggregate/derived models are retrained after redaction. Design supports this from Day 1 — bolting it on later is far harder.
- **Never in the log:** message content, free-text personal data, precise passive location, raw browsing streams.
- **Consent dimension:** `sensitive`-class facts require in-product consent to exist at all (e.g., matching implies it); their cross-product invisibility is structural (§7), not policy.

## 11. Validation Rules (the entire enforcement implementation)

The single fact-emission function rejects:
1. Unregistered verb (non-namespaced) or malformed namespace
2. Unknown `context` value (when present)
3. Unknown entity kind / nonexistent entity IDs
4. Missing required context (e.g., `matched` without context)
5. Invalid visibility, or visibility below a verb's floor (e.g., `matched(dating)` below `sensitive`)
6. `occurred_at` in the future
7. Any attempt to UPDATE or DELETE a fact outside the §10 redaction path (enforced with DB grants/policies)

Plus: emission is wired into product transaction-completion functions, not left to per-feature discretion.

## 12. Day 1 Scope vs. Explicitly Deferred

**Day 1 (this is the whole implementation — ~one table, ~20 registry entries, one validation function, one habit):**
- Fact table with the §2 envelope, in Postgres
- Entity registry + role table, seeded from Clerk users, `dj_profiles`, `partner_profiles`
- This document as the registry; validation function enforcing §11
- Emission from existing noqt.events transaction points: booking confirmed → `booked`; payment completed → `purchased`; review submitted → `reviewed`/`rated`; event delivered → `performed_at`/`supplied`/`hosted`
- Redaction path (§10) implemented, even if never yet used

**Explicitly deferred — do NOT implement yet:**
- ❌ Graph database or any traversal engine (trigger: a concrete query impossible/slow in SQL)
- ❌ Trust/reputation scoring (at current volume it is noise with authority)
- ❌ Embeddings, learned models, collaborative filtering (needs volume)
- ❌ Confidence-scored inferred edges (intelligence layer, later)
- ❌ Real-time/streaming fact infrastructure (a table insert is the pipeline)
- ❌ Taxonomy expansion beyond what a shipping product concretely emits
- ❌ Section 4's object-extension spec (wait for the second product)

Purpose reminder: at today's user counts, this machinery doesn't power intelligence — it ensures the interactions of users 1–500 are already in the moat when user 50,000 arrives. Store history unconditionally; derive trust opportunistically; sell warrants continuously.

## 13. Governance & Changelog

Process for canonical changes (new verb/context/kind, promotion of a namespaced verb): one-page proposal (definition, emission trigger, which recommender treats it differently — the §1.5 altitude test), founder sign-off, entry below.

| Date | Change | Approved by |
|---|---|---|
| 2026-07-19 | v1: initial envelope, 7 entity kinds, 23 canonical verbs, 8 contexts, 3 visibility classes | Founder — **envelope, principles, visibility & privacy rules ratified; verb/context/threshold lists remain DRAFT** (see header note) |
