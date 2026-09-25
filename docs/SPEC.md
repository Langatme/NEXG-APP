# NEXG App — Project Specification

**Version:** 2.2.0
**Date:** 2026-09-22
**Live:** https://nexgapp.com
**Repository:** `C:\Users\limta\Downloads\nexg-concierge`

This document describes what the product **is**. For the state of the work — what is deployed,
what is broken, and what to do next — read [`HANDOFF-2026-09-22.md`](./HANDOFF-2026-09-22.md).

---

## 1. What this is

A consumer marketplace for Nairobi, Kenya. One app to browse and buy across food, groceries,
pharmacy, spa, transport, property and experiences — with separate onboarding flows for the
merchants, couriers and hosts who supply it.

The distinguishing idea is **breadth in one surface**: a user does not install five apps for
dinner, a massage, an airport transfer and a grocery run. They open NEXG, and the catalogue
spans all of it.

**Positioning:** premium and concierge-led rather than discount-led. The copy speaks about
curation and discretion; the brand colour is gold on near-black.

### Who uses it

| Role | What they do |
| --- | --- |
| **Consumer** | Browse, search, order, track, book |
| **Merchant** | Onboard, list items, receive and fulfil orders |
| **Courier** | Onboard, accept deliveries, navigate, complete |
| **Host** | List properties |
| **Admin** | Financials, merchants, inventory, commissions, content |

---

## 2. Catalogue

**Generated, not authored.** This matters more than any other single fact about the data.

```
21 categories · 128 subcategories · 640 merchants · 6,000 items
```

Produced by `scripts/regenerate_catalog_seed.py` from the source workbook into `src/db/seed_excel.sql`,
which is the single source of truth. The merchant names and item titles are **synthetic** —
"Atlas Appliances House", "Japanese Miyazaki A5 Wagyu Ribeye Cut" — generated to fill the
catalogue with plausible variety.

**Consequence:** merchant detail pages have **no real menu sections**. Every merchant shows the
same generic structure because the generator produced items without authored grouping. This is
the highest-value data problem in the project and no amount of frontend work fixes it.

### The 21 catalogue categories

For customer browsing, Travel & Tours is grouped under Experiences. The catalogue retains
its separate category ID for merchant records and booking workflows.

```
Adults Only · Airport Transfers · Alcohol & Beverages · Beauty
Concierge Services · Experiences · Fashion & Apparel · Financial Services
Flowers & Gifts · Groceries & Essentials · Health · Laundry & Cleaning
Logistics & Shipping · Marketplace · Pharmacy · Restaurants & Food
Tech & Electronics · Travel & Tours · Vehicle Rentals · Vehicle Services · Wellness
```

---

## 3. Technology

| Layer | Choice | Why |
| --- | --- | --- |
| UI | React 19 | — |
| Build | Vite 6 | Fast, and the image pipeline already depended on it |
| Styling | Tailwind v4 via `@tailwindcss/vite` | CSS-first config, no JS config file |
| Motion | Motion **and** react-spring | See the boundary rule below |
| Server | Express 4 | One process serving both API and SPA |
| Database | PostgreSQL 15 | — |
| Runtime | Node 24 | Runs `server/*.ts` natively, strip-only |
| Deployment | Docker Compose, nginx in front | — |

### Two animation libraries, one rule

**One library per component subtree.** Both write `transform` and `opacity`; two writers on one
node means the last one wins and the result depends on mount order.

- **react-spring** — gesture-driven and interruptible motion. The docked search bar.
- **Motion** — declarative enter/exit, list transitions.

Full reasoning in [`ANIMATION.md`](./ANIMATION.md).

### The single-port decision

The Express process serves the built SPA **and** the API on one port. The previous stack used
nginx for static files plus a separate PHP-FPM pool for the API, which meant two things to keep
in sync. One origin also means no CORS in production and a session cookie that just works.

---

## 4. Architecture

```
                    ┌──────────────────────┐
   visitor ──TLS──▶ │  Cloudflare (proxy)  │
                    └──────────┬───────────┘
                               │ HTTP  (see HANDOFF §5.1 — this leg is NOT encrypted)
                    ┌──────────▼───────────┐
                    │  nginx  :80          │  /etc/nginx/sites-available/nexgapp.com
                    └──────────┬───────────┘
                               │ proxy_pass
                    ┌──────────▼───────────┐
                    │  app   127.0.0.1:3101│  Express: API + built SPA
                    └──────────┬───────────┘
                               │ DATABASE_URL
                    ┌──────────▼───────────┐
                    │  postgres 127.0.0.1:5433 │
                    └──────────────────────┘
```

Both containers publish on **loopback only**. Nothing but nginx is reachable from the internet.

### Middleware order — load-bearing

```
securityHeaders   headers present even on a rejection
observability     must see every request, before anything can reject it
rateLimit         after observability, so a blocked request is still counted
client identity   resolved once, reused by later consumers
express.json      body parsing
routes
```

Rate limiting sits **after** observability deliberately: ordered the other way, an attack would
be invisible in the metrics, which is exactly when you want to see it.

### Server modules

| File | Responsibility |
| --- | --- |
| `index.ts` | Wiring, routes, static serving |
| `security.ts` | Rate limiting, security headers, client identity |
| `observability.ts` | Spans, metrics, traces, telemetry ingestion |
| `tracing.ts` | W3C `traceparent`, span lifecycle |
| `logger.ts` | Structured JSON, child loggers with bindings |
| `repository.ts` | All SQL |
| `db.ts` | Pool, readiness, fallback detection |
| `auth/` | `routes.ts`, `session.ts`, `crypto.ts` |
| `version.ts` | Build metadata |

### Data-source fallback

If Postgres is unreachable the API **serves the bundled JSON catalogue** and says so via
`source` in `/api/health`. Useful in development, dangerous in production: a misconfigured
`DATABASE_URL` produces a healthy-looking app serving stale data. **Always check `source`.**

---

## 5. Features

### Discovery and search

The customer browse surface is a photo-led Nairobi discovery screen. It includes live merchant
search, a slowly looping responsive category rail, dedicated category screens, subcategory
filters, server sorting, infinite results, and merchant cards. The opening rail curates up to 15
categories by service and booking value, with Adults Only last; the visible number adapts to the
viewport, and every catalogue category remains available through “All categories.”

### Home

Hero with a rotating service line, docked search bar, category rail, sponsored carousel, promo,
how-it-works, features, merchant ad carousel.

The hero rotates seven lines: **Relax · Cravings · Rides · Stock Up · Experiences ·
Exclusive 18+ · Membership**. Each is a lead word plus a support line, with the lead 5% larger
so the eye lands on it first.

### Merchant page

Hero image, rating, hours, minimum order, delivery estimate, item list, add-to-cart, cart
drawer, checkout.

### Onboarding — three flows

Merchant, Courier, Host. Each is a multi-step form: details, documents, review, submit. Draft
state and final submissions are stored through Express and PostgreSQL so a half-finished
application survives a refresh without keeping its personal and payout details in browser storage.
The current controls track document filenames; they do not upload document bytes yet.

### Commerce modes

Merchants carry a mode — order-and-deliver, booking, enquiry — and the UI adapts. A spa booking
and a grocery order are not the same flow and the item sheet knows the difference.

### Auth

Email and password. **scrypt** hashing with parameters stored in the hash. HS256 JWT in an
`httpOnly` `SameSite=Lax` cookie. CSRF via an `Origin` check. Details in [`AUTH.md`](./AUTH.md).

### Observability

In-process spans, metrics and traces exposed at `/api/metrics` and `/api/traces`, with a
developer dashboard. Spans are **OpenTelemetry-shaped** (W3C `traceparent`, spanId) so wiring an
external collector is configuration rather than a rewrite. See
[`OBSERVABILITY.md`](./OBSERVABILITY.md).

### Consent and privacy

A cookie banner gates analytics and marketing categories separately from strictly-necessary
storage. Consent is stored client-side and read by telemetry.

---

## 6. Design system

### Type

| Role | Family | Notes |
| --- | --- | --- |
| Display / headings | **Quicksand** variable | `wght` axis **stops at 700** |
| Body | **Inter** | |

**Weight has a ceiling.** Quicksand's axis ends at 700. A request for 900 renders **synthetic**
bold — smeared counters, uneven stroke — which reads *lighter*, not heavier. To go bolder, buy
weight optically: scale, leading, ink. Measured: 800 and 900 paint at identical widths to 700,
which is the signature of a dilated outline rather than a heavier master. The 83 uses of the
800-weight utility on Cooper elements are correct — Cooper ships a real 800.

A Material 3 type scale drives the roles: display 57px/1.12/−0.0044em, headline 28px/1.29,
title 22px/1.27, body 1.5/+0.031em.

### Colour

Gold `#F8A61E` on near-black `#111315`, with a light theme. Brand gold is constant across
themes.

**Tailwind v4 does not generate opacity modifiers for custom theme colours.** `bg-gold/12`
compiles to **nothing**, silently. Use the `--color-gold-tint` and `--color-gold-line` tokens.

### The logo

`LogoIcon` renders the supplied artwork as **inline SVG** with two variants:

- **`mark`** — the gold G with the bell, square. For slots that show the name in text.
- **`wordmark`** — NEXG including the mark. For standalone use.

Aspect ratio is **2.64:1** (361×137), so it sizes by height with `w-auto`. A fixed square box
squashes it, and anything under ~28px tall is not legible.

The letters are near-black in the artwork, so the wordmark sets its own ink — near-black on
light, white on dark. It does **not** inherit `currentColor`, because call sites pass accent
colours that would tint the letters.

The favicon is the mark alone: `public/favicon.svg` and `favicon-dark.svg`.

### Layout rules

- Public surfaces are dark by default.
- Cards are rounded and generous; the reference is Wolt.
- Section rhythm around 48px between blocks.
- Tap targets are at least 44px.

---

## 7. API

All under `/api`. Full contract in [`API.md`](./API.md).

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Status and **data source** |
| GET | `/api/version` | Build metadata |
| GET | `/api/categories` | Categories with nested subcategories |
| GET | `/api/merchants` | Paged merchants; `category`, `q`, `limit`, `offset`, `sort` |
| GET | `/api/merchants/:id` | One merchant with items |
| GET | `/api/search` | Cross-catalogue search |
| GET | `/api/areas` | Delivery areas |
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/refresh` | Rotate session |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Current user |
| POST | `/api/leads/email` | Lead capture |
| GET/POST | `/api/telemetry` | Client events |
| GET | `/api/metrics` | Metrics, JSON or `?format=prometheus` |
| GET | `/api/traces` | Recent spans |

### Rate limits

Keyed on **both** IP and device; a request passes only if both are under their ceiling.

| Route family | Per device | Per IP | Window |
| --- | --- | --- | --- |
| `POST /api/auth/{login,signup,refresh}` | **10** | 100 | 15 min |
| `POST /api/leads/email` | 20 | 200 | 60 min |
| telemetry, metrics, traces | 120 | 1,200 | 60 min |
| other `/api/` | 300 | 3,000 | 60 min |

**The ceilings differ on purpose.** One shared tight number means a single egress IP with ten
users behind it locks out the eleventh — and shared egress is not an edge case: mobile carrier
NAT, corporate networks and campus wifi all put thousands of people behind one address.

**Known limit:** counters are in-memory. Two instances make the effective limit
`max × instances`; serverless may never fire it. Both failures are silent.

---

## 8. Security posture

| Control | State |
| --- | --- |
| HTTPS | Cloudflare to visitor; **origin leg is plaintext** — see HANDOFF §5.1 |
| Public ports | 22, 80 only |
| Backend | loopback only, not reachable from the internet |
| SSH | key-only, `PermitRootLogin prohibit-password`, `MaxAuthTries 3` |
| fail2ban | active |
| Unattended upgrades | enabled and active |
| Security headers | CSP, HSTS, nosniff, DENY, Referrer-Policy, Permissions-Policy |
| `X-Powered-By` | removed |
| Rate limiting | per device and per IP |
| Passwords | scrypt |
| Sessions | httpOnly, SameSite=Lax, CSRF Origin check |
| Debug mode | `false` in production |

`style-src` allows `'unsafe-inline'` **deliberately** — Motion and react-spring set inline
styles every frame and Vite injects its stylesheet at runtime. `script-src` does **not** get the
same concession, and it is the directive that actually stops XSS. Reasoning in
[`SECURITY.md`](./SECURITY.md).

---

## 9. Quality gates

```bash
npx tsc --noEmit                    # types
npm test                            # 53 unit
node scripts/api-contract-test.mjs  # 29 API    (needs API on :3001)
node scripts/v2-flow-test.mjs       # 18 flow   (needs Vite on :3000)
node scripts/v3-consistency-test.mjs# 24 consistency (needs Vite on :3000)
npm run build
```

**Current baseline: tsc 0 errors, 53 / 29 / 18 / 24, build clean.**

The flow and consistency suites need both services running. If they print **nothing**, the
services are down — not the tests. This has been misdiagnosed as a regression more than once.

### Device testing

`scripts/device-presets.mjs` holds **18 real phone sizes** — iPhone SE through 16 Pro Max,
Galaxy S8 through S24 Ultra, Fold, plus Tecno, Infinix and Redmi at 360px. The widths where
layouts break are **320, 344 and 360**.

`logs/critique/_device-matrix.mjs` runs those against four pages and reports horizontal
overflow, clipped text and viewport escapes.

**Not a bug:** marquees and carousels extend past the viewport by design. A 1880px rail inside a
360px scroller is how a horizontal rail works.

---

## 10. What this product is not

Stated plainly, because pretending otherwise wastes time:

- **Not a native app.** It is a responsive web application.
- **Not backed by real merchants.** 640 of them are generated.
- **Not multi-tenant.** One catalogue, one instance.
- **Not payment-integrated.** Checkout is simulated.
- **Not migrated from the previous system.** The predecessor was a different stack with a
  different database; its 63 orders and 283 user tokens were **not** carried over.
- **Not finished on mobile.** See the handoff.

---

## 11. Related documents

| Question | Document |
| --- | --- |
| Current state, traps, next steps | [`HANDOFF-2026-09-22.md`](./HANDOFF-2026-09-22.md) |
| How to deploy | [`DEPLOY-STEP-BY-STEP.md`](./DEPLOY-STEP-BY-STEP.md) |
| How it is built | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| Auth and its limits | [`AUTH.md`](./AUTH.md) |
| Logs, traces, metrics, consent | [`OBSERVABILITY.md`](./OBSERVABILITY.md) |
| Rate limiting and headers | [`SECURITY.md`](./SECURITY.md) |
| Which animation library where | [`ANIMATION.md`](./ANIMATION.md) |
| API contract | [`API.md`](./API.md) |
