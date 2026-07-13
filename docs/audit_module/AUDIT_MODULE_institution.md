# Module Upgrade Audit: institution
**Date**: 2026-07-13 · **Status**: ✅ CONVERTED (static-pinned) — no ETL
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
The tenancy keystone. In the multi-tenant original this served the institutions registry; in the spoke it is **statically pinned** — the entity `institution.mDbSchema.ts` was **deleted** (37 lines) and `institution.service.ts` rewritten (128 lines) to return a single hard-pinned institution via **`getStaticInstitution()`** reading the **`INSTITUTION_ID`** env. **No `institutions` table exists in the KA DB** (`query.js prod institutions` → no table). No ETL, no migration — this is the intended single-tenant design.

**Verdict counts:** **all ✅ (deliberately retired → static) · 0 🔁 · 1 ❓ (env presence)**.

## 1. Scope & component map
`src/institution/` — controller/service/router/interface (**entity removed**). Route `/institutions` (public list; returns the one static institution). `getStaticInstitution()` is consumed by `institutionResolver.middleware`, `authToken.service` (JWT), and anywhere the old code needed the tenant id. **Tables owned:** none (was `institutions`, now static).

## 2. Tables affected
| Table | prod | ka | Verdict |
|---|---|---|---|
| `institutions` | — (not in KA per-tenant DB) | — (none) | 🗑️ retired → static `getStaticInstitution()` |

## 3. Variables & env keys
**`INSTITUTION_ID`** — the stable KA institution UUID (kept identical to the old value so in-flight JWTs stay valid). `getStaticInstitution()` **fails fast** if unset. This is the one thing that must be present in the KA deployment env.

## 4. Production reality
No `institutions` table in the KA per-tenant DB (institution registry lived centrally in the multi-tenant setup). Nothing to read/migrate.

## 5. New-system state
`institution.service.ts` → `getStaticInstitution()` builds an `IInstitution` from `INSTITUTION_ID` (+ static name/config). No entity, no migration, no rows. `institutionResolver` defaults every request to this static institution (no per-request tenant routing).

## 6. Gap analysis
1. **Schema** — 🗑️ entity retired (no table). 2. **Tenancy removal** — ✅ **this module is the removal** — replaces `DataSourceManager` per-tenant routing with a static pin. 3. **Dept scoping** — n/a (departments handle intra-institution scoping). 4. **Reference boundary** — n/a. 5. **Services** — n/a. 6. **PG-portability** — ✅ no DB access. 7. **ETL** — none. 8. **API contract** — `/institutions` still returns an institution shape (now always the one static institution) — compatible.

## 7. Upgrade plan
**Nothing to implement.** Operational requirement only: ensure **`INSTITUTION_ID`** is set in the KA env (matching the historical KA institution UUID). Optionally confirm the static name/config fields match what the frontend expects.

## 8. Risks & mitigations
- **`INSTITUTION_ID` unset/wrong** → fail-fast at boot (good) or wrong id invalidates existing JWTs → keep the historical value.

## 9. Open questions
1. Confirm `INSTITUTION_ID` in the KA deployment env equals the original KA institution UUID (so old tokens/links remain valid).

## 10. Approval checklist
- [x] Scope confirmed (retired → static)
- [x] No table / no ETL
- [ ] `INSTITUTION_ID` env confirmed present + correct
- [x] API contract compatible
