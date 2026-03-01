# Run index-only migrations (no data loss)

These migrations **only add indexes** to existing tables. They do **not**:

- Drop any table
- Delete or truncate any rows
- Change any existing data

The `submissions` table and all its data stay exactly as they are; only index structures are added to speed up queries.

---

## Order: run exactly in this sequence

1. **Backup (Kasr El Ainy backup)** – test first so production is untouched  
2. **KA (Kasr El Ainy Neurosurgery)** – production  
3. **KA_CTS** – production  
4. **MD** – production  

---

## 1. Backup database (SQL_*_B_KA)

**Env vars** (in `.env`):

- `SQL_HOST_B_KA` (e.g. kasralainy.net)
- `SQL_PORT_B_KA` (e.g. 3306)
- `SQL_DB_NAME_B_KA` (e.g. elbob)
- `SQL_USERNAME_B_KA`
- `SQL_PASSWORD_B_KA`
- Optional: `SSL_CA_PATH_B_KA` only if the backup server requires SSL

**Command:**

```bash
npm run db:migrate:backup
```

---

## 2. KA production (Kasr El Ainy Neurosurgery)

**Env vars** (in `.env`):

- `SQL_HOST_DEFAULT`
- `SQL_PORT_DEFAULT`
- `SQL_DB_DEF_NAME_KA`
- `SQL_USERNAME_DEFAULT`
- `SQL_PASSWORD_DEFAULT`
- `SSL_CA_PATH` (e.g. ca.pem)

**Command:**

```bash
npm run db:migrate:production
```

---

## 3. KA_CTS production

Uses same host/credentials as KA; different database name.

**Env vars:** Same as KA, plus:

- `SQL_DB_DEF_NAME_KA_CTS`

**Command:**

```bash
npm run db:migrate:production:ka-cts
```

---

## 4. MD production

Uses same host/credentials as KA; different database name.

**Env vars:** Same as KA, plus:

- `SQL_DB_DEF_NAME_MD`

**Command:**

```bash
npm run db:migrate:production:md
```

---

## What gets run

Each command runs only the **index** migrations (four migrations total):

1. `AddCalSurgsProcDateIndex` – index on `cal_surgs(procDate)`
2. `AddEventsDateTimeIndex` – index on `events(dateTime)`
3. `AddEventAttendanceCandidateIdIndex` – index on `event_attendance(candidateId)`
4. `AddSubmissionsDashboardIndexes` – three indexes on `submissions`:  
   `candDocId`, `(candDocId, subStatus, submissionType)`, `(subStatus, submissionType, candDocId)`

TypeORM records which migrations have already run. If a migration was run before, it will be skipped (e.g. "No pending migrations").
