# Module Upgrade Audit: waBot
**Date**: 2026-07-13 · **Status**: 📋 DRAFT — awaiting user approval
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
WhatsApp bot + session store. Owns `whatsapp_sessions` (**1 prod row — ephemeral session state**). Notable: it's the **first module still using `DataSourceManager.getDataSource(institutionId)`** (6 refs) + 40 `institutionId` refs — BUT this is **neutralized by the pinned single-institution `datasource.manager.ts`** (+ `getStaticInstitution()` in `waSession.service.ts`), so every lookup resolves to the one `AppDataSource`. Functionally converted; a cosmetic cleanup remains. Its phone-matching delegates to `cand`/`supervisor` providers (already fixed for PG). **Recommend NOT migrating the ephemeral session data.**

**Verdict counts:** **6 ✅ · 1 🔁 (cosmetic tenancy cleanup) · 1 ❓**.

## 1. Scope & component map
`src/waBot/` (both sides) — controller/service/provider/router + `waSession.service.ts` + `whatsappSession.mDbSchema.ts` + constants. Route `/waBot`. **3 files changed main→branch** (15 ins / 51 del — tenancy already simplified). Calls `candService.getCandByPhoneDigits` + `supervisorService.getSupervisorByPhoneDigits` (both PG-fixed in `51a02d0`/`4998433`). **Table owned:** `whatsapp_sessions`.

## 2. Tables affected
| Table | prod | Rows | ka | Verdict |
|---|---|---|---|---|
| `whatsapp_sessions` | ✅ | 1 (ephemeral) | 0 | ❓ recommend **skip ETL** (session state rebuilds) |

## 3. Variables & env keys
WhatsApp/bot provider config (tokens/webhook secret — must exist in KA env; verify the deployment's WA credentials). Uses `getStaticInstitution()`. 

## 4. Production reality
`whatsapp_sessions` — `id BIGSERIAL`(KA)/auto in prod; `wa_from varchar(32)` UNIQUE, `linked_user_id/linked_candidate_id/linked_supervisor_id char(36)`, `linked_role enum(candidate,supervisor,unknown)`, `conversation_state`, `context_json text`, `expires_at`, timestamps. **1 prod row** (a live/expired session — transient).

## 5. New-system state
KA `whatsapp_sessions` (`InitKaSchema`): `id BIGSERIAL`, `wa_from` UNIQUE, char(36) link ids, `whatsapp_sessions_linked_role_enum`, `TIMESTAMP(3)` fields. Live rows: **0**. `DataSourceManager` is pinned → `getDataSource(anyId)` returns the static `AppDataSource`.

## 6. Gap analysis
1. **Schema** — ✅ live (BIGSERIAL id, enums, char(36) links kept as free ids).
2. **🔁 Tenancy** — **cosmetically coupled**: `DataSourceManager.getDataSource(institutionId)` at `waBot.provider.ts:530`, `waSession.service.ts:39/47/58`. Works because the manager is pinned. **Cleanup (optional):** replace with `AppDataSource` directly and drop the `institutionId` plumbing (40 refs) — reduces confusion, not required for correctness.
3. **Dept scoping** — n/a (bot resolves the user, whose department is on the user row).
4. **Reference boundary** — none.
5. **In-workspace services** — ✅ waBot IS one of the per-institution services (stays local). Calls cand/supervisor (PG-fixed).
6. **PG-portability** — ✅ no MySQL SQL idioms of its own (phone matching lives in cand/supervisor providers, already fixed).
7. **ETL** — ❓ `whatsapp_sessions` is **ephemeral** (expiring conversation state). Recommend **skip** — sessions naturally rebuild on next message. Migrating the 1 stale row adds no value.
8. **API contract** — ✅ webhook/bot contract unchanged.

## 7. Upgrade plan (proposed)
1. **(Optional) tenancy cleanup** — swap `DataSourceManager.getDataSource(institutionId)` → `AppDataSource`; strip `institutionId` params. Cosmetic.
2. **No ETL** for `whatsapp_sessions` (ephemeral) — start empty.
3. **Verify** WA bot env credentials present in the KA deployment.

## 8. Risks & mitigations
- Leaving `DataSourceManager` in place is safe (pinned) but obscures the single-tenant model — cleanup when convenient.
- WA credentials missing in KA env → bot silently fails; verify.

## 9. Open questions
1. **Migrate the 1 `whatsapp_sessions` row?** Recommend **no** (ephemeral). Confirm.
2. Do the tenancy cleanup now or defer? (cosmetic).

## 10. Approval checklist
- [ ] Scope confirmed
- [ ] Ephemeral-table skip approved (whatsapp_sessions)
- [ ] Tenancy cleanup decision (now/defer)
- [ ] WA env credentials confirmed
- [ ] Approved to implement
