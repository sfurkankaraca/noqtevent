# NOQT — Product Vision

> Status: Foundation document, v1 (2026-07-19). Produced from the founder/CTO strategy discussion.
> Audience: future engineering sessions (human or AI). Read this before making product-boundary decisions.

## 1. Company Thesis

NOQT is not an event company, a booking company, a dating app, or an academy. Those are products.

**NOQT is a connection company.** The business solves one problem:

> Helping the right people find, trust, collaborate with, and **repeatedly** meet the right people through shared experiences.

The unit of output — what the company fundamentally produces — is the **warranted introduction**: putting two parties in front of each other with a reason to believe it will go well. A booking is a warranted introduction between customer and artist. A course is a warranted introduction between learner and expertise. A match is a warranted introduction between two people. A community is a standing machine for producing warranted introductions repeatedly.

The word "repeatedly" in the mission is load-bearing. It is what distinguishes NOQT from every one-shot introduction service (brokers, classic dating apps): NOQT is designed as a loop, not a funnel.

## 2. Product / Asset / Outcome — do not confuse these

| Layer | What it is | Where it lives |
|---|---|---|
| **Product** (what customers pay for) | Warrants: vetted bookings, credible matches, backed introductions, trusted education | Each of the three products |
| **Asset** (what compounds, cannot be recreated) | **Accumulated shared-experience history**, joinable through one identity | Platform: identity spine + fact log |
| **Outcome** (what emerges in people) | Trust — derived, perishable, always recomputed from history, **never stored as a value** | Intelligence layer (computed on demand) |

Strategic sequence: **store history unconditionally, derive trust opportunistically, sell warrants continuously.**

Analogy set: Instagram stores content; Spotify stores listening history; GitHub stores collaboration history; **NOQT stores shared-experience history.** In all cases the winner is the company that never threw history away and kept it joinable to a stable identity.

## 3. The Core Engine: Introduction ↔ Participation Flywheel

```
Identity → Interaction → Shared history → Relationship → Trust → future Interaction …
```

Two strokes, one engine:

- **Introduction** (edge-creating): first encounter between two entities with no shared history. Bookings, matches, discovery. **This is where revenue concentrates** — introductions are discrete, high-stakes, chargeable.
- **Participation** (edge-weighting): the same entities meeting again — communities, cohorts, recurring events, rituals. **This is where the asset accumulates** — repetition generates history density.

Rule: **introductions monetize, participation compounds.** These two phases must be measured separately (introduction quality = at the moment; participation = retention over time) and must not be collapsed into one metric or one product owner.

## 4. The Three Products

Products are separated because they differ on all three axes that justify a product boundary: revenue model, audience, and core interaction loop.

### 4.1 noqt.events — B2B private-event services & operations

- **What it is:** Platform for people and companies that want NOQT to produce or support private events (weddings, corporate events, brand launches, private parties, hotels, venues).
- **Services:** DJs, live artists, sound & lighting, event planning, music direction, decoration, technical production, photography/video, other event partners.
- **Audience:** Event buyers — couples, corporations, organizers, hotels, venues.
- **Revenue model:** B2B service margin — commission on bookings, production fees, contracts.
- **Ownership rule:** **The customer owns the event. NOQT provides the services and operates the event lifecycle.**
- **Explicitly NOT:** a public event platform. No public discovery, no ticketing here — ever (see §7 Non-goals).
- **Role in flywheel:** revenue engine and credibility engine. Generates commercial and operational relationship facts.

### 4.2 noqta.club — education & media platform

- **What it is:** Two intertwined halves under one brand:
  - **Education:** DJ Academy, artist education, courses, workshops, artist resources.
  - **Magazine:** a new-generation digital magazine covering the electronic music world — editorial features, artist interviews, scene/industry coverage, blog/journal, podcast, videos. Not a static blog: a contemporary media brand in its own right, and the audience-building top of funnel for the education side.
- **Audience:** DJs, artists, producers, beginners, people interested in music and creative careers; the magazine additionally targets the broader electronic music audience (listeners, scene followers).
- **Revenue model:** B2C content/education — course sales, subscriptions, possibly sponsorship.
- **Explicitly NOT:** a public event platform (this was an earlier idea, now abandoned).
- **Role in flywheel:** generates learning, expertise, and creator signals. Feeds verified skill into the ecosystem (e.g., a completed course can warrant a supplier listing in noqt.events).

### 4.3 NOQT Social — consumer social discovery

- **What it is:** Social platform bringing people together through shared interests and real-world experiences. Friendship, communities, interest groups, event discovery, ticketing, dating (as one feature, not the frame).
- **Audience:** General consumers. "Social discovery through experiences," not a traditional dating app.
- **Revenue model:** consumer — ticketing fees, subscriptions, marketplace/social commerce.
- **Boundary decision (deliberate, defend it):** **NOQT Social owns public-event discovery and ticketing — including for events noqt.events produced.** noqt.events can be a *supplier* into Social's public listings, but never owns the consumer-facing surface. This is the boundary most likely to erode via shortcuts; do not let it.
- **Role in flywheel:** generates human relationships and discovery signals. Highest moat-per-interaction of the three products, because it creates *recurring* low-stakes real-world encounters (participation stroke).

## 5. Shared vs. Independent

**Shared (platform property, all products consume):**
- Identity spine — one entity ID per real human/organization across all products
- Interaction fact log — the canonical shared-experience history (see `INTERACTION_ONTOLOGY.md`)
- Payments rails (charge/refund/ledger/payout — not pricing logic)
- Media/storage, notifications transport, AI gateway plumbing
- Intelligence boundary (recommendation/matching interface)
- Design system — visual coherence is the cheapest "one ecosystem" signal

**Independent (each product owns, never shared):**
- Transactional models and their state machines (booking lifecycle, enrollment, matching mechanics)
- Product databases (no shared application database, ever)
- Pricing, packaging, commercial rules
- Product-specific UX loops and metrics

**Ecosystem coherence without coupling:** products reference each other only by platform IDs and integrate via async events (`CourseCompleted`, `BookingConfirmed`, `PersonVerifiedArtist`). Cross-sell moments (finish DJ Academy → noqt.events supplier badge) are built on these events, never on direct reads of another product's data.

**The divestiture test (apply at every roadmap review):** could any product be sold or shut down tomorrow without breaking the others, except through the shared platform layer? If not, a boundary has leaked. Note: in any divestiture, the accumulated fact log is **company property**, not the product's — a divested product stops *emitting*, but existing history stays.

## 6. Revenue Model Differences (why one app can't serve all three)

| | noqt.events | noqta.club | NOQT Social |
|---|---|---|---|
| Model | B2B service margin | B2C content/subscription | Consumer ticketing/social commerce |
| Purchase frequency | Rare, high-value | Periodic, mid-value | Frequent, low-value |
| Buyer | Event owner (person/company) | Individual learner | Individual consumer |
| Sales motion | Quote → contract → payment plan | Self-serve checkout | Impulse / in-app |

## 7. Explicit Non-goals

1. noqt.events will **not** become a public event platform. No public listings, no consumer ticketing.
2. noqta.club will **not** become an events product. Education and media only.
3. NOQT Social is **not** a dating app. Dating is one feature inside social discovery.
4. No fourth product until the three above are live and generating facts. "Communities" and "Ticketing" are capabilities inside NOQT Social, not products.
5. Trust is never stored as a score in the canonical data. It is always recomputed from history.
6. No shared application database across products.
7. No speculative platform services (chat, operations, generic "events domain service") before a second real consumer exists.

## 8. Founder Decisions (ratified 2026-07-19)

- [x] **Dijital Davetiye and Memory Drive remain modules of noqt.events for now**, with the explicit option to separate them into standalone products later. Their current architectural independence (own tables, own routes) must be preserved so that later separation stays cheap.
- [x] **Product sequencing: NOQT Social is the second product to be developed; noqta.club follows later.** noqt.events remains the revenue engine meanwhile.
- [x] **Product names are provisional.** "noqta.club" and "NOQT Social" are working names, not final branding. Do not hardcode branding assumptions into schemas or identifiers (use neutral `product_source` values).
- [x] **Documentation remains in English.** (Codebase language unchanged; this decision covers `/docs` only.)

## 9. Remaining Open Decisions

- [ ] Final branding/domains for products two and three.
- [ ] Timing of the security fixes and code changes described in `SOFTWARE_ARCHITECTURE.md` — identified and planned, but **not yet approved for implementation**.
