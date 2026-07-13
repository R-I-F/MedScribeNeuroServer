# Module Upgrade Audit: refApi
**Date**: 2026-07-13 · **Status**: ✅ NEW MODULE (hub sync) — no prod ETL
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
**Brand-new module** (does not exist on main — 6 files, +788 lines). It is the **LibelusRefApi (hub) client + mirror-sync engine**: `refApi.client.ts` (HTTP client), `refData.service.ts` (polling), `refMirror.service.ts` (mirror upsert), and the HMAC re-sync webhook `POST /admin/ref-resync` (`refResync.router.ts`). It **owns no source-of-truth table** — it *writes* the local mirror tables (`departments`, `main_diags`, `diagnoses`, `proc_cpts`, `lectures`, `lecture_topics`, join tables) from the hub. **No prod MySQL ETL** — reference truth comes from the hub, not `kasr-el-ainy`. This module is the whole reason the reference cluster needs no data migration.

**Verdict counts:** **all ✅ (new, converted) · 0 🔁 · 1 ❓ (env/first-sync)**.

## 1. Scope & component map
`src/refApi/` — **new on branch** (no main counterpart). `refApi.client.ts`, `refData.service.ts`, `refMirror.service.ts`, `refResync.router.ts`, config. Route `/admin/ref-resync` (HMAC-verified webhook). Populates/refreshes the mirror tables consumed by `referenceRead`, `bundler`, `diagnosis`, `mainDiag`, `procCpt`, `lecture`, `departments`. **Tables owned:** none directly (writes the mirror; the mirror entities live in their own modules).

## 2. Tables affected
None owned. **Writes** (as mirror): `departments` (15), `main_diags` (196), `diagnoses` (1,319), `proc_cpts` (1,429), `lectures` (3,237), `lecture_topics` (141), `main_diag_diagnoses`, `main_diag_procs` — all already populated in KA.

## 3. Variables & env keys
**`REF_API_URL`, `REF_API_KEY`** (hub client) + the HMAC **webhook secret** for `/admin/ref-resync`. Must exist in the KA deployment env.

## 4. Production reality
N/A — this module has no `kasr-el-ainy` counterpart. The old system embedded reference data per-tenant; the spoke replaces that with the hub + mirror.

## 5. New-system state
Mirror is **live and populated** (counts above). `refMirror.service.ts` upserts hub payloads; `refData.service.ts` polls; the webhook triggers on-demand re-sync. `WidenMirrorTextColumns` migration widened mirror text columns (from the earlier "value too long" fix).

## 6. Gap analysis
1. **Schema** — ✅ mirror tables created by `InitKaSchema` (+ `WidenMirrorTextColumns`).
2. **Tenancy** — ✅ n/a (single mirror for the one institution).
3. **Department scoping** — ✅ the mirror carries dept associations (main_diags/lecture_topics have dept); `referenceRead` scopes reads.
4. **Reference boundary** — ✅ **this module IS the boundary** — it owns the hub→mirror sync so no other module re-owns reference truth.
5. **Services** — hub client (external). Stays here.
6. **PG-portability** — ✅ new PG-native code.
7. **ETL** — ✅ **none from prod**; reference data flows from the hub via sync (already done — mirror populated).
8. **API contract** — new webhook only; no legacy contract to preserve.

## 7. Upgrade plan
**Nothing to migrate.** Operational: ensure `REF_API_URL`/`REF_API_KEY`/HMAC secret in the KA env, and that the sync/poll is scheduled so the mirror stays fresh. Optionally run one manual `/admin/ref-resync` after deploy to confirm connectivity.

## 8. Risks & mitigations
- Missing hub env → mirror goes stale (but existing rows persist). Verify env + a successful sync post-deploy.
- Hub schema drift → covered by `WidenMirrorTextColumns`-style migrations.

## 9. Open questions
1. Confirm hub env keys present + a scheduled sync (cron/poll interval) in the KA deployment.

## 10. Approval checklist
- [x] Scope confirmed (new module, hub sync)
- [x] No prod ETL (reference from hub)
- [ ] Hub env keys + sync schedule confirmed
- [x] Mirror populated (verified live)
