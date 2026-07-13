# Module Upgrade Audit: equipment
**Date**: 2026-07-13 (re-audited ×2) · **Status**: ✅ IMPLEMENTED — hub-mirrored, dept-scoped, synced
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `696c87f` + PG `ka-institute`

## 0. TL;DR — RESOLVED
`equipment` is **hub-owned reference data**, and as of commit **`696c87f`** ("Mirror hub equipment & consumables + dept-scoped legacy reads") it is **fully wired and synced**. Your hub update **is now reflected in KA**: `ka-institute.equipment` = **102** rows + `department_equipment` = **234** dept-links. The hub added the `/v1/departments/:code/equipment` endpoint (live 200), the spoke added the client method + mirror sync, the KA table gained `arName` (bilingual) + timestamps + a dept M2M — i.e. **option (a) dept-scoped**. Nothing left to do.

**Verdict:** **all ✅ · 0 🔁 · 0 ❓**.

## 1. Scope & component map
`src/equipment/` — now **read-only mirror reads** with `referenceRead` department resolution (`?deptCode` → JWT `departmentId` → `REF_DEPT_CODE`). Read by `bundler`. Entity `@Entity("equipment")` `@PrimaryColumn` char(36) hub-UUID + `equipment` (legacy name col = hub `name`) + **`arName`** + timestamps. **Tables owned (mirror):** `equipment` + `department_equipment` (M2M).

## 2. Tables affected
| Table | prod MySQL | Hub | ka (now) | Verdict |
|---|---|---|---|---|
| `equipment` | 11 (superseded) | authoritative (102, shared/deduped) | ✅ **102 (synced)** | ✅ mirror |
| `department_equipment` | — | dept M2M | ✅ **234 links** | ✅ mirror |

## 3. Variables & env keys
Hub sync env `REF_API_URL` + `REF_API_KEY`/`REF_API_KA` (in `.env.staging`, verified live). `REF_DEPT_CODE` for read scoping.

## 4. Reality (verified live 2026-07-13)
- **Hub endpoint:** `GET /v1/departments/NS/equipment` → **200** (was 404 earlier the same day; added since).
- **Hub model:** global `equipment(id uuid, name, arName)` + `department_equipment(departmentId, equipmentId)` M2M, per-department data.
- **Spoke sync:** `refApi.client.getEquipment()` + `refApi.types.IRefEquipment` + `legacyShapes.mapper.toMirrorEquipment` + `refMirror.service` pulls per-dept, dedups shared items (`equipById` map), rebuilds `department_equipment`. Migration `1783782609980-ExtendEquipmentConsumablesMirror` added `arName`/timestamps + the join table.
- **KA live:** `equipment` **102**, `department_equipment` **234**. Hub UUIDs preserved.
- prod MySQL `equipment` (11) fully **superseded**.

## 5. Gap analysis
1. **Schema** — ✅ hub-UUID PK + `arName` + dept M2M (matches hub). 2. **Reference boundary** — ✅ hub-owned, mirrored via refApi; local write-path retired (module is read-only now). 3. **Dept scoping** — ✅ dept-scoped via `department_equipment` + `referenceRead`. 4. **PG-portability** — ✅. 5. **Sync** — ✅ wired + run (102/234). 6. **API** — reads now dept-scoped mirror reads (`bundler` + `/equipment`).

## 6. Upgrade plan — ✅ DONE (commit `696c87f`)
Nothing outstanding. Keep the hub sync running (poll / `POST /admin/ref-resync`) so future hub edits propagate.

## 7. Risks — none material; re-running the sync is idempotent (upsert + join rebuild).
## 8. Open questions — none. (prod MySQL 11 intentionally superseded by hub 102.)
## 9. Approval checklist
- [x] Hub endpoint live (`/v1/departments/:code/equipment`)
- [x] Spoke client + mirror sync wired (`696c87f`)
- [x] Dept-scoped + bilingual model (arName + `department_equipment`)
- [x] KA synced (102 items / 234 dept-links) — hub update reflected
