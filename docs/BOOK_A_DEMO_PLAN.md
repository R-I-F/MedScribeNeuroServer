# 📅 Book a Demo — Landing-Page Demo-Request Feature (Living Plan)

> **⚠️ LIVING DOCUMENT — user-mandated convention.** Update the checkpoint table below **after every stage** (and mid-stage on interruption). Future sessions: READ THIS FIRST before touching the feature.

**Status: ✅ IMPLEMENTED + E2E VERIFIED (2026-07-22) — only the user browser click-test and the commit/merge/deploy remain. Branches: `feat/book-a-demo` in BOTH repos (uncommitted).**

---

## 🔄 Progress Checkpoint

| Stage | What | Status | Notes |
|-------|------|--------|-------|
| A | This living doc created | ✅ done (2026-07-22) | user approved the plan |
| B | Backend module `src/demoRequest/` + validator + rate limiter + wiring | ✅ done (2026-07-22) | entity/service/provider/controller/router + `requestDemo.validator` + `demoRequestRateLimiter` (5/15min/IP) + DI/route/entity wiring + `.env` vars (`DEMO_REQUEST_NOTIFY_EMAIL`, `DEMO_REQUEST_DEV_LOG: true` local). tsc clean |
| C | Migration `1783782610170-CreateDemoRequests` applied | ✅ done (2026-07-22, user-approved) | applied to ka-institute (prod); table + 3 indexes verified via read-only SELECT |
| D | Frontend modal form + api.requestDemo + i18n EN/AR | ✅ done (2026-07-22) | `LandingDemoForm.tsx` (modal, honeypot, elapsedMs, a11y, RTL) + `LandingContact` CTA swap (mailto → button) + `demoForm` i18n EN+AR + `api.requestDemo` + `.demo-modal*` CSS. tsc + vite build clean |
| E | Docs (API_DOCUMENTATION.md + CLAUDE.md + finalize this doc) | ✅ done (2026-07-22) | API doc: new Demo Requests section + TOC + auth-summary row |
| F | E2E verification | ✅ done (2026-07-22) | alt-port :3014/:3015 curl matrix ALL GREEN: happy 201+row+**3 real Mailgun emails delivered to contact@medscribe.health**; honeypot/fast/per-email/per-IP discards → identical 201 + no row (log-confirmed reasons); oversize message 400; limiter 5×201→6th 429. Test rows (demo-test-*) deleted; table left at 0 rows |

### ⬜ Remaining
- [ ] **User browser click-test**: EN + AR (RTL), open/close (Escape + overlay click), submit → success panel, real email arrives
- [ ] Commit both repos (`feat/book-a-demo`) on user ask; merge/push to `main` = production deploy (user-gated)
- [ ] **Railway env**: optionally set `DEMO_REQUEST_NOTIFY_EMAIL` (defaults to contact@medscribe.health anyway); ensure `DEMO_REQUEST_DEV_LOG` is NOT set in production

---

## Context

The landing page's "Book a demo" CTA (`NeuroLogBookFront/src/components/landing/LandingContact.tsx:54`, i18n key `contact.cta`) is currently a `mailto:contact@medscribe.health` link — on machines without a configured mail client it silently does nothing, which is why it appears broken. Replace it with a real, abuse-hardened feature.

**User-approved decisions (2026-07-22):**
1. **Mechanism**: in-page modal form → new public `POST /demoRequest` → row **stored** in a `demo_requests` Postgres table + notification email to **contact@medscribe.health** (confirmed live mailbox) via the existing `MailerService` (Mailgun).
2. **Anti-abuse**: honeypot + min-fill-time + per-email/per-IP caps + global daily email budget + dedicated IP rate limiter. **No CAPTCHA. No auto-reply** to the requester (an auto-reply endpoint would let bots use our server to email arbitrary addresses).
3. This doc is the living record of what's done / not done.

**Constraints:** `ka-institute` **IS production** — the migration applies only on explicit user go-ahead. Work on branches `feat/book-a-demo` in both repos (off `main`); commit/push only on explicit ask.

---

## Anti-abuse design (defense in depth)

**Anti-oracle rule:** every discard path returns the **identical generic `201 { message: "Thanks — we'll be in touch soon." }`** — a bot can never tell whether its request was stored, emailed, or silently dropped. Only express-validator format errors return 400; the rate limiter returns the standard 429.

| Layer | Rule | Env override (default) |
|---|---|---|
| Route rate limiter | new `demoRequestRateLimiter`: **5 req / 15 min / IP** (+ existing global 400/15min) | honors `DISABLE_RATE_LIMIT` |
| Honeypot | hidden `website` field non-empty → silent discard + log | — |
| Timing | `elapsedMs` missing or < 3000 ms → silent discard (client-supplied heuristic — forgeable; the real teeth are the caps below) | `DEMO_REQUEST_MIN_FILL_MS` (3000) |
| Per-email cap | 1 stored+emailed per email per 24 h (repeats silently discarded) | `DEMO_REQUEST_PER_EMAIL_PER_DAY` (1) |
| Per-IP cap | 3 stored per IP per 24 h | `DEMO_REQUEST_PER_IP_PER_DAY` (3) |
| Global email budget | max **20 notification emails per UTC day**; beyond that rows are stored but email is skipped (protects the inbox + Mailgun reputation even against distributed bots) | `DEMO_REQUEST_EMAIL_BUDGET_PER_DAY` (20) |
| Validation | length caps: name 120, email 255, org 160, phone 32, message 2000; global 500 kb body cap already applies | — |
| Email safety | **HTML-escape every user-supplied field** in the notification email (new `escapeHtml` helper); send failure → row kept with `emailedAt NULL`, logged, still generic 201 | — |
| Recipient | `DEMO_REQUEST_NOTIFY_EMAIL` (default `contact@medscribe.health`) · local dev: `DEMO_REQUEST_DEV_LOG=true` logs the composed email (OTP_DEV_LOG pattern) | env |

Rows are **kept forever** (they're sales leads) — no purge sweep. Worst-case targeted attack outcome: attacker fills the `demo_requests` table at ≤3 rows/IP/day; the inbox receives at most 20 emails/day total.

---

## Stage B — backend module `src/demoRequest/` (template: `src/pendingSignup/`)

| File | Content |
|---|---|
| `src/demoRequest/demoRequest.mDbSchema.ts` | `@Entity("demo_requests")`: `id` uuid PK, `fullName` varchar(120), `email` varchar(255) lowercased, `organization` varchar(160) NULL, `phoneNum` varchar(32) NULL, `message` varchar(2000) NULL, `ip` varchar(64), `userAgent` varchar(512) NULL, `emailedAt` timestamp NULL, `createdAt`. Indexes: `(email, createdAt)`, `(ip, createdAt)`, `(emailedAt)` |
| `src/migrations-ka/1783782610170-CreateDemoRequests.ts` | raw-SQL up/down mirroring `...160-CreatePendingSignups.ts` (`uuid_generate_v4()`, table + 3 indexes, clean `down()`) |
| `src/demoRequest/demoRequest.service.ts` | thin repo, methods take `DataSource`: `create`, `countByEmailSince`, `countByIpSince`, `countEmailedSince`, `markEmailed` (`MoreThanOrEqual` count pattern from `passwordReset.service.countTokensByUserId`) |
| `src/demoRequest/demoRequest.provider.ts` | `submit(input, {ip, userAgent}, ds)` — ordered gates, each silently discarding with a `[DemoRequest] discarded (<reason>)` log: honeypot → timing → normalize email → per-email cap → per-IP cap → **store row** → global-budget check → try/catch email send → `markEmailed`. Email compose `getDemoEmailHtml/Text` cloned from `pendingSignup.provider.getOtpEmailHtml` (brand LibelusPro), subject `New demo request — <name>`, body = escaped field table + timestamp + IP + userAgent. Never throws to the router |
| `src/demoRequest/demoRequest.controller.ts` | thin passthrough (module-shape parity) |
| `src/validators/requestDemo.validator.ts` | `fullName` 2–120 · `email` isEmail ≤255 · `organization`/`phoneNum`/`message` optional trimmed caps · `website` **optional, allowed** (the honeypot must PASS validation so the provider can silently discard) · `elapsedMs` optional int |
| `src/demoRequest/demoRequest.router.ts` | `POST /` → `demoRequestRateLimiter` → validator → `validationResult`/`matchedData` → controller; try/catch returns the SAME generic 201 even on internal error |
| `src/middleware/rateLimiter.middleware.ts` | append `demoRequestRateLimiter` (clone of `strictRateLimiter`, `max: 5`) |

**Wiring:** DI bindings in `src/config/container.config.ts` (next to PendingSignup, ~line 214) · mount `app.use("/demoRequest", ...)` in `src/config/routes.config.ts` **before** the `"/"` referenceRead mount (line 132) · add `DemoRequestEntity` to `entities[]` in **both** `src/config/database.config.ts` and `src/config/ka-migrations.config.ts` · `.env`: add `DEMO_REQUEST_NOTIFY_EMAIL: contact@medscribe.health` + `DEMO_REQUEST_DEV_LOG: true` (local only — NEVER production).

## Stage C — migration apply ⚠️ GATED

`npm run db:ka:migrate` targets **production** `ka-institute`. STOP and get the user's explicit go-ahead. Verify with a read-only `SELECT` afterwards. Must land before the backend deploy (endpoint 500s without the table).

## Stage D — frontend (templates: signup pages + `LandingPicker` overlay)

| File | Content |
|---|---|
| `src/utils/api.ts` | `api.requestDemo(body)` — public-POST pattern of `registerCand` (JSON, `credentials: 'include'`, no auth headers); omit empty optionals, always send `website` (even `""`) + `elapsedMs`; surface 429 distinctly |
| `src/content/landingPage.i18n.ts` | new `demoForm` block in the `LandingCopy` type + EN (~after line 179) + AR (~after line 334): `title, sub, nameLabel, emailLabel, orgLabel, phoneLabel, messageLabel, submit, submitting, successTitle, successBody, errorGeneric, errorTooMany, closeLabel, requiredHint` |
| `src/components/landing/LandingDemoForm.tsx` (new) | modal on **local state** (no Redux): `.institution-overlay` shell + `login-*` field styles + small new `.demo-form*` CSS; `role="dialog" aria-modal="true"`, Escape + overlay-click close (LandingPicker keydown pattern), autofocus first input; fields name*/email*/org/phone/message (`<textarea maxLength={2000}>`) validated via `src/lib/utils` helpers (`validateEmail`, `validateFullName`, `validatePhoneInput`); honeypot input visually hidden (`tabIndex={-1}`, `autoComplete="off"`, `aria-hidden`); `renderedAt = useRef(Date.now())` → `elapsedMs` at submit; states idle → submitting → success panel / inline error (429 → `errorTooMany`); RTL-safe (logical properties; test AR) |
| `src/components/landing/LandingContact.tsx` | replace the mailto CTA (lines 54–59) with a `<button>` + local `useState`; keep the email/website info rows unchanged |
| `src/styles/landing.css` | append `.demo-form` block (card, textarea, honeypot-hide class) |

## Stage E — docs

- `API_DOCUMENTATION.md`: new `POST /demoRequest` section (generic-201-by-design, 400 validation, 429; honeypot/`elapsedMs` documented; caps described as intentionally opaque) + a row in the Authentication Requirements Summary.
- `CLAUDE.md`: session-log entry. This doc: mark all stages, record final values.

## Stage F — verification

Backend: `npx tsc --noEmit`; boot alt-port (`PORT=8081 DEMO_REQUEST_DEV_LOG=true`) and curl:
1. Happy path → 201 + row + dev-logged email content, `emailedAt` set
2. Honeypot filled → 201 + **no** row + discard log
3. `elapsedMs: 500` → 201 + no row
4. Repeat same email → 201 + still one row / one email
5. 4th request same IP (distinct emails) → 201 + only 3 rows
6. 6th request within 15 min → 429
7. Message > 2000 chars → 400

⚠️ Test rows land in the **production** table — record their ids and delete them after verification (with user's knowledge).
Frontend: `npx tsc --noEmit` + `npm run build`; **user click-test**: EN + AR (RTL), Escape/overlay close, success panel, real email arrives at contact@medscribe.health.
Deploy prereqs (user-gated): migration applied; Railway env `DEMO_REQUEST_NOTIFY_EMAIL` set (or default applies); **no** `DEMO_REQUEST_DEV_LOG` in production.

---

## Key existing code to reuse

- `src/pendingSignup/pendingSignup.provider.ts` — module shape, inline-HTML email template, caps/dedupe/sweep blueprint
- `src/mailer/mailer.service.ts` — `sendMail({to, subject, text, html})` (the public `/mailer/send` route stays 410; we call the service internally)
- `src/middleware/rateLimiter.middleware.ts` — `strictRateLimiter` clone base
- `src/passwordReset/passwordReset.provider.ts` — app-level hourly-cap counting pattern
- Frontend: `CandidateSignupPage.tsx` (form/validation/state pattern), `LandingPicker.tsx` (overlay/Escape pattern), `api.registerCand` (public POST pattern)
