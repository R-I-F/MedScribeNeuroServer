# Duplicate Submissions Report — Kasr El Ainy (Easy to Read)

**Report generated:** 2026-02-21

---

## What This Report Is

This report looks at the **Kasr El Ainy** logbook database and finds cases where **the same person (candidate) logged the same surgery more than once**. It then classifies each duplicate group as **concerning** or **non-concerning** using the criteria below. The report does **not** change any data—it only reads and lists.

## Words We Use

| Term | Meaning |
|------|--------|
| **Candidate** | A trainee/resident who logs their surgical experience. |
| **Procedure / surgery case** | One specific surgery (identified by a procedure ID). |
| **Submission** | One log entry; each has a unique **submission ID**. |
| **Duplicate** | The same candidate submitted more than one log entry for the **same** surgery. |
| **CPT link** | The procedure codes (CPT) linked to that submission. |
| **ICD link** | The diagnosis codes (ICD) linked to that submission. |

## When Is a Duplicate “Concerning”?

A duplicate group is **concerning** only if **all** of the following are true for every submission in that group:

- The **role in surgery** (`roleInSurg`) is the **same** for every duplicate submission.
- The **CPT links** (procedure codes linked to the submission) are the **same** set for every duplicate.
- The **ICD links** (diagnosis codes linked to the submission) are the **same** set for every duplicate.

If the duplicates differ in role, or in which CPT/ICD codes are linked, we treat the group as **non-concerning** (e.g. the candidate may have legitimately logged the same surgery twice in different roles or with different procedures/diagnoses).

---

## The Numbers (Summary)

| What we counted | Number |
|------------------|--------|
| **Candidates with at least one duplicate (any kind)** | 18 |
| **Total duplicate groups (same candidate + same surgery)** | 91 |
| **Total submission rows in those groups** | 184 |

| Metric | Count |
|--------|-------|
| **Concerning duplicate groups** (reported below) | 7 |

## Who Has Concerning Duplicates? (Quick List)

| # | Candidate name | Number of concerning (candidate, surgery) pairs | Total duplicate submission entries |
|---|-----------------|--------------------------------------------------|-----------------------------------|
| 1 | hatem hassan husien mohammed khattab | 1 | 2 |
| 2 | mark charl amin luca | 1 | 2 |
| 3 | ali ismail ahmed shafik ali | 1 | 2 |
| 4 | eman ibrahim kamel ibrahim | 3 | 6 |
| 5 | youssef ayman youssef ragheb | 1 | 2 |

## Concerning Duplicates (same role + same CPT + same ICD)

### hatem hassan husien mohammed khattab

- **Candidate ID:** `28d5f3a3-8247-4f36-878d-6e61404ca4fc`
- **Classification:** Concerning
- **Number of concerning (candidate, surgery) pairs:** 1
- **Total submission rows in these groups:** 2

#### Surgery case ID: `84925400-81b5-4e57-ba8d-014164c1ad56`

- **Times submitted:** 2
- **Submission IDs:**
  - `0e4f2b5b-bec6-4f79-b0d9-ef73ac0d0853`
  - `886ba19e-642d-4fb6-9feb-f0c894f20398`

---

### mark charl amin luca

- **Candidate ID:** `65951cdd-41fd-46ad-a3df-3cd97020ad68`
- **Classification:** Concerning
- **Number of concerning (candidate, surgery) pairs:** 1
- **Total submission rows in these groups:** 2

#### Surgery case ID: `029764cb-da48-4006-98c7-269ecc4e0669`

- **Times submitted:** 2
- **Submission IDs:**
  - `24eb16ac-fb77-45eb-a4aa-276043290d93`
  - `9368aa43-db15-451f-8121-3bebd6de7c27`

---

### ali ismail ahmed shafik ali

- **Candidate ID:** `a229ea55-0558-4146-8d2a-80296479f973`
- **Classification:** Concerning
- **Number of concerning (candidate, surgery) pairs:** 1
- **Total submission rows in these groups:** 2

#### Surgery case ID: `641502f9-9102-4ee8-8a35-e528289b4c6b`

- **Times submitted:** 2
- **Submission IDs:**
  - `3b99b836-48d3-4048-8064-1c739020abf1`
  - `0e6f9d95-bce1-4f51-815f-15a3055fb569`

---

### eman ibrahim kamel ibrahim

- **Candidate ID:** `b5c16455-8c28-4140-9086-42fac798f7d8`
- **Classification:** Concerning
- **Number of concerning (candidate, surgery) pairs:** 3
- **Total submission rows in these groups:** 6

#### Surgery case ID: `1ef64ae7-df6f-4529-a196-0b57593efb90`

- **Times submitted:** 2
- **Submission IDs:**
  - `eb417d5c-1bbf-4e17-a292-5eaeeec46e4f`
  - `e3fb07fd-a78a-4040-b9c3-4c3aedfb6ca6`

#### Surgery case ID: `51d9615e-3141-4d81-8923-9d944ce4c64e`

- **Times submitted:** 2
- **Submission IDs:**
  - `83f5ef70-cd61-402a-bce4-aca2e8cb082a`
  - `b822cd80-3aaa-427b-a2fb-128a0864e0b4`

#### Surgery case ID: `90732898-1a0a-42c8-82b7-703d34356cea`

- **Times submitted:** 2
- **Submission IDs:**
  - `7ee0d96e-3dd4-4bd9-9f95-c68d2e6183aa`
  - `74a2b4ed-548e-43e2-a6db-6ba238c6f84b`

---

### youssef ayman youssef ragheb

- **Candidate ID:** `f9b417b5-e4f5-4800-8555-ea4566408ba5`
- **Classification:** Concerning
- **Number of concerning (candidate, surgery) pairs:** 1
- **Total submission rows in these groups:** 2

#### Surgery case ID: `8cbc4ee4-9305-4327-8bb1-e4d0ab6fd0c3`

- **Times submitted:** 2
- **Submission IDs:**
  - `68f4ad83-1ac5-4f5f-9a8b-1196445a9a55`
  - `13f2a8cf-b239-4606-9ac2-8b36f1f4cde4`

---

## Reference Table (concerning duplicate groups)

| Candidate ID | Candidate Name | Surgery case ID | Times submitted | Submission IDs |
|---------------|----------------|------------------|------------------|----------------|
| `28d5f3a3-8247-4f36-878d-6e61404ca4fc` | hatem hassan husien mohammed khattab | `84925400-81b5-4e57-ba8d-014164c1ad56` | 2 | 0e4f2b5b-bec6-4f79-b0d9-ef73ac0d0853,886ba19e-642d-4fb6-9feb-f0c894f20398 |
| `65951cdd-41fd-46ad-a3df-3cd97020ad68` | mark charl amin luca | `029764cb-da48-4006-98c7-269ecc4e0669` | 2 | 24eb16ac-fb77-45eb-a4aa-276043290d93,9368aa43-db15-451f-8121-3bebd6de7c27 |
| `a229ea55-0558-4146-8d2a-80296479f973` | ali ismail ahmed shafik ali | `641502f9-9102-4ee8-8a35-e528289b4c6b` | 2 | 3b99b836-48d3-4048-8064-1c739020abf1,0e6f9d95-bce1-4f51-815f-15a3055fb569 |
| `b5c16455-8c28-4140-9086-42fac798f7d8` | eman ibrahim kamel ibrahim | `1ef64ae7-df6f-4529-a196-0b57593efb90` | 2 | eb417d5c-1bbf-4e17-a292-5eaeeec46e4f,e3fb07fd-a78a-4040-b9c3-4c3aedfb6ca6 |
| `b5c16455-8c28-4140-9086-42fac798f7d8` | eman ibrahim kamel ibrahim | `51d9615e-3141-4d81-8923-9d944ce4c64e` | 2 | 83f5ef70-cd61-402a-bce4-aca2e8cb082a,b822cd80-3aaa-427b-a2fb-128a0864e0b4 |
| `b5c16455-8c28-4140-9086-42fac798f7d8` | eman ibrahim kamel ibrahim | `90732898-1a0a-42c8-82b7-703d34356cea` | 2 | 7ee0d96e-3dd4-4bd9-9f95-c68d2e6183aa,74a2b4ed-548e-43e2-a6db-6ba238c6f84b |
| `f9b417b5-e4f5-4800-8555-ea4566408ba5` | youssef ayman youssef ragheb | `8cbc4ee4-9305-4327-8bb1-e4d0ab6fd0c3` | 2 | 68f4ad83-1ac5-4f5f-9a8b-1196445a9a55,13f2a8cf-b239-4606-9ac2-8b36f1f4cde4 |