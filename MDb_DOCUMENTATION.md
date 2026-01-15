# MariaDB Database Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Database Architecture](#database-architecture)
3. [Table Structures](#table-structures)
4. [Relationships & Foreign Keys](#relationships--foreign-keys)
5. [Polymorphic Relationships](#polymorphic-relationships)
6. [Data Types & Conventions](#data-types--conventions)
7. [Indexes & Constraints](#indexes--constraints)
8. [Migration Notes](#migration-notes)
9. [Best Practices](#best-practices)

---

## Overview

### Migration Context
This database was migrated from **MongoDB** (using Mongoose ODM) to **MariaDB** (using TypeORM). The migration was performed component-by-component to ensure data integrity and maintainability.

### Technology Stack
- **Database**: MariaDB (MySQL-compatible)
- **ORM**: TypeORM
- **Primary Key Strategy**: UUID (v4) - `char(36)`
- **Character Set**: `utf8mb4` with `utf8mb4_unicode_ci` collation (supports Arabic text)

### Key Design Decisions
1. **UUID Primary Keys**: All tables use UUIDs instead of auto-incrementing integers for better distributed system support
2. **Strict Foreign Keys**: Most relationships use `ON DELETE RESTRICT` to prevent accidental data loss
3. **Polymorphic Relationships**: Some relationships are handled at the application level (no database-level FK constraints)
4. **JSON Columns**: Used for arrays and nested objects (e.g., `location`, `diagnosisName`, `procedureName`)
5. **Many-to-Many Relationships**: Implemented using join tables

---

## Database Architecture

### Entity Relationship Overview

```
┌─────────────┐
│  Hospitals  │
└──────┬──────┘
       │
       │ (1:N)
       ▼
┌─────────────┐
│  Cal Surgs  │───(N:1)───► Arab Procs
└──────┬──────┘
       │
       │ (1:N)
       ▼
┌─────────────┐
│ Submissions │───(N:1)───► Candidates
└──────┬──────┘            Supervisors
       │                    Main Diags
       │
       │ (N:M)
       ├───► Proc CPTs (via submission_proc_cpts)
       └───► Diagnoses (via submission_icds)

┌─────────────┐
│ Main Diags  │───(N:M)───► Diagnoses (via main_diag_diagnoses)
└──────┬──────┘            Proc CPTs (via main_diag_procs)

┌─────────────┐
│   Events    │───(1:N)───► Event Attendance
└──────┬──────┘
       │
       ├───(N:1)───► Lectures
       ├───(N:1)───► Journals
       └───(N:1)───► Confs

┌─────────────┐
│   Confs     │───(N:1)───► Supervisors (presenter)
└─────────────┘

User Tables:
- Candidates
- Supervisors
- Institute Admins
- Super Admins
```

---

## Table Structures

### 1. Core Reference Tables

#### `hospitals`
Reference table for hospital information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `arabName` | `varchar(100)` | NOT NULL | Arabic hospital name |
| `engName` | `varchar(100)` | NOT NULL | English hospital name |
| `location` | `json` | NULLABLE | `{long: number, lat: number}` |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

#### `diagnoses`
ICD diagnosis codes and names.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `icdCode` | `varchar(255)` | NOT NULL | ICD-10 code |
| `icdName` | `varchar(500)` | NOT NULL | Diagnosis name (Arabic/English) |
| `neuroLogName` | `json` | NULLABLE | Array of alternative names |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

**Character Set**: `utf8mb4_unicode_ci` (supports Arabic text)

#### `proc_cpts`
CPT procedure codes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `title` | `varchar(100)` | NOT NULL | Procedure title |
| `alphaCode` | `varchar(10)` | NOT NULL | Alphabetic code |
| `numCode` | `varchar(10)` | NOT NULL | Numeric code |
| `description` | `varchar(500)` | NOT NULL | Procedure description |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

**Character Set**: `utf8mb4_unicode_ci`

#### `arab_procs`
Arabic procedure codes (alternative coding system).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `title` | `varchar(100)` | NOT NULL | Procedure title |
| `alphaCode` | `varchar(10)` | NOT NULL | Alphabetic code |
| `numCode` | `varchar(255)` | NOT NULL | Numeric code |
| `description` | `text` | NOT NULL | Procedure description |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

**Character Set**: `utf8mb4_unicode_ci`

#### `main_diags`
Main diagnosis entries with associated diagnoses and procedures.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `title` | `varchar(200)` | NOT NULL | Main diagnosis title |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

**Relationships**:
- **Many-to-Many** with `diagnoses` (via `main_diag_diagnoses` join table)
- **Many-to-Many** with `proc_cpts` (via `main_diag_procs` join table)

**Join Tables**:
- `main_diag_diagnoses`: `mainDiagId` → `diagnosisId`
- `main_diag_procs`: `mainDiagId` → `procCptId`

---

### 2. User Tables

#### `candidates`
Medical candidates/residents.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `timeStamp` | `datetime` | NULLABLE | Registration timestamp |
| `email` | `varchar(255)` | UNIQUE, NOT NULL | Email address |
| `password` | `varchar(255)` | NOT NULL | Hashed password |
| `fullName` | `varchar(255)` | NOT NULL | Full name |
| `regNum` | `varchar(50)` | NOT NULL | Registration number |
| `phoneNum` | `varchar(50)` | NOT NULL | Phone number |
| `nationality` | `varchar(100)` | NOT NULL | Nationality |
| `rank` | `enum` | NOT NULL | Candidate rank |
| `regDeg` | `enum` | NOT NULL | Registration degree |
| `google_uid` | `varchar(255)` | NULLABLE | Google Sheets UID |
| `approved` | `boolean` | DEFAULT false | Approval status |
| `role` | `enum` | DEFAULT 'candidate' | User role |
| `termsAcceptedAt` | `datetime` | NULLABLE | Terms of Service acceptance timestamp |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

**Character Set**: `utf8mb4_unicode_ci`

#### `supervisors`
Medical supervisors.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `email` | `varchar(255)` | UNIQUE, NOT NULL | Email address |
| `password` | `varchar(255)` | NOT NULL | Hashed password |
| `fullName` | `varchar(255)` | NOT NULL | Full name |
| `phoneNum` | `varchar(50)` | NOT NULL | Phone number |
| `approved` | `boolean` | DEFAULT false | Approval status |
| `role` | `enum` | DEFAULT 'supervisor' | User role |
| `canValidate` | `boolean` | DEFAULT true, NULLABLE | Can validate submissions |
| `position` | `enum` | NULLABLE | Supervisor position |
| `termsAcceptedAt` | `datetime` | NULLABLE | Terms of Service acceptance timestamp |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

**Character Set**: `utf8mb4_unicode_ci`

#### `institute_admins`
Institute administrators.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `email` | `varchar(255)` | UNIQUE, NOT NULL | Email address |
| `password` | `varchar(255)` | NOT NULL | Hashed password |
| `fullName` | `varchar(255)` | NOT NULL | Full name |
| `phoneNum` | `varchar(50)` | NOT NULL | Phone number |
| `approved` | `boolean` | DEFAULT true | Approval status |
| `role` | `enum` | DEFAULT 'instituteAdmin' | User role |
| `termsAcceptedAt` | `datetime` | NULLABLE | Terms of Service acceptance timestamp |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

**Character Set**: `utf8mb4_unicode_ci`

#### `super_admins`
Super administrators (highest privilege level).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `email` | `varchar(255)` | UNIQUE, NOT NULL | Email address |
| `password` | `varchar(255)` | NOT NULL | Hashed password |
| `fullName` | `varchar(255)` | NOT NULL | Full name |
| `phoneNum` | `varchar(50)` | NOT NULL | Phone number |
| `approved` | `boolean` | DEFAULT true | Approval status |
| `role` | `enum` | DEFAULT 'superAdmin' | User role |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

**Character Set**: `utf8mb4_unicode_ci`

**Note**: Super Admins do NOT have `termsAcceptedAt` field (they are system administrators).

---

### 3. Clinical Data Tables

#### `cal_surgs`
Calendar surgeries/procedures.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `timeStamp` | `datetime` | NOT NULL | Procedure timestamp |
| `patientName` | `varchar(255)` | NOT NULL | Patient name |
| `patientDob` | `date` | NOT NULL | Patient date of birth |
| `gender` | `enum('male','female')` | NOT NULL | Patient gender |
| `hospitalId` | `char(36)` | NOT NULL | FK → `hospitals.id` |
| `arabProcId` | `char(36)` | NULLABLE | FK → `arab_procs.id` |
| `procDate` | `date` | NOT NULL | Procedure date |
| `google_uid` | `varchar(255)` | NULLABLE | Google Sheets UID |
| `formLink` | `text` | NULLABLE | Form link |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

**Foreign Keys**:
- `hospitalId` → `hospitals.id` (ON DELETE RESTRICT)
- `arabProcId` → `arab_procs.id` (ON DELETE RESTRICT, nullable)

**Character Set**: `utf8mb4_unicode_ci`

#### `submissions`
Surgical case submissions by candidates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `timeStamp` | `datetime` | NOT NULL | Submission timestamp |
| `candDocId` | `char(36)` | NOT NULL | FK → `candidates.id` |
| `procDocId` | `char(36)` | NOT NULL | FK → `cal_surgs.id` |
| `supervisorDocId` | `char(36)` | NOT NULL | FK → `supervisors.id` |
| `roleInSurg` | `varchar(100)` | NOT NULL | Role in surgery |
| `assRoleDesc` | `text` | NULLABLE | Assistant role description |
| `otherSurgRank` | `varchar(100)` | NOT NULL | Other surgeon rank |
| `otherSurgName` | `varchar(255)` | NOT NULL | Other surgeon name |
| `isItRevSurg` | `boolean` | NOT NULL | Is revision surgery |
| `preOpClinCond` | `text` | NULLABLE | Pre-op clinical condition |
| `insUsed` | `varchar(100)` | NOT NULL | Instruments used |
| `consUsed` | `varchar(100)` | NOT NULL | Consumables used |
| `consDetails` | `text` | NULLABLE | Consumables details |
| `mainDiagDocId` | `char(36)` | NOT NULL | FK → `main_diags.id` |
| `subGoogleUid` | `varchar(255)` | UNIQUE, NOT NULL | Google Sheets UID |
| `subStatus` | `enum` | DEFAULT 'pending' | Status: 'approved', 'pending', 'rejected' |
| `diagnosisName` | `json` | NOT NULL | Array of diagnosis names |
| `procedureName` | `json` | NOT NULL | Array of procedure names |
| `surgNotes` | `text` | NULLABLE | Surgical notes |
| `IntEvents` | `text` | NULLABLE | Intraoperative events |
| `spOrCran` | `varchar(50)` | NULLABLE | Spinal or cranial |
| `pos` | `varchar(50)` | NULLABLE | Position |
| `approach` | `varchar(255)` | NULLABLE | Surgical approach |
| `clinPres` | `text` | NULLABLE | Clinical presentation |
| `region` | `varchar(50)` | NULLABLE | Anatomical region |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

**Foreign Keys**:
- `candDocId` → `candidates.id` (ON DELETE RESTRICT)
- `procDocId` → `cal_surgs.id` (ON DELETE RESTRICT)
- `supervisorDocId` → `supervisors.id` (ON DELETE RESTRICT)
- `mainDiagDocId` → `main_diags.id` (ON DELETE RESTRICT)

**Many-to-Many Relationships**:
- **Proc CPTs**: via `submission_proc_cpts` join table
  - `submissionId` → `procCptId`
- **Diagnoses (ICDs)**: via `submission_icds` join table
  - `submissionId` → `icdId`

**Join Tables**:
- `submission_proc_cpts`: Links submissions to multiple CPT procedure codes
- `submission_icds`: Links submissions to multiple ICD diagnosis codes

**Character Set**: `utf8mb4_unicode_ci`

---

### 4. Educational Content Tables

#### `lectures`
Lecture resources.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `lectureTitle` | `varchar(255)` | NOT NULL | Lecture title |
| `google_uid` | `varchar(255)` | UNIQUE, NOT NULL | Google Sheets UID |
| `mainTopic` | `varchar(255)` | NOT NULL | Main topic |
| `level` | `enum('msc','md')` | NOT NULL | Lecture level |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

**Character Set**: `utf8mb4_unicode_ci`

#### `journals`
Journal articles/resources.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `journalTitle` | `varchar(255)` | NOT NULL | Journal title |
| `pdfLink` | `text` | NOT NULL | PDF link |
| `google_uid` | `varchar(255)` | UNIQUE, NOT NULL | Google Sheets UID |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

**Character Set**: `utf8mb4_unicode_ci`

#### `confs`
Conference presentations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `confTitle` | `varchar(255)` | NOT NULL | Conference title |
| `google_uid` | `varchar(255)` | UNIQUE, NOT NULL | Google Sheets UID |
| `presenterId` | `char(36)` | NOT NULL | FK → `supervisors.id` |
| `date` | `date` | NOT NULL | Conference date |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

**Foreign Keys**:
- `presenterId` → `supervisors.id` (ON DELETE RESTRICT)

**Character Set**: `utf8mb4_unicode_ci`

---

### 5. Event Management Tables

#### `events`
Scheduled events (lectures, journals, conferences).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `type` | `enum` | NOT NULL | Event type: 'lecture', 'journal', 'conf' |
| `lectureId` | `char(36)` | NULLABLE | FK → `lectures.id` (if type='lecture') |
| `journalId` | `char(36)` | NULLABLE | FK → `journals.id` (if type='journal') |
| `confId` | `char(36)` | NULLABLE | FK → `confs.id` (if type='conf') |
| `dateTime` | `datetime` | NOT NULL | Event date and time |
| `location` | `varchar(255)` | NOT NULL | Event location |
| `presenterId` | `char(36)` | NOT NULL | **Polymorphic** - see notes below |
| `status` | `enum` | DEFAULT 'booked' | Status: 'booked', 'held', 'canceled' |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |
| `updatedAt` | `datetime` | NOT NULL | Auto-updated |

**Foreign Keys**:
- `lectureId` → `lectures.id` (ON DELETE RESTRICT, nullable)
- `journalId` → `journals.id` (ON DELETE RESTRICT, nullable)
- `confId` → `confs.id` (ON DELETE RESTRICT, nullable)
- `presenterId` → **NO FK CONSTRAINT** (polymorphic - see below)

**Polymorphic Relationship - `presenterId`**:
- For `type='journal'`: `presenterId` references `candidates.id`
- For `type='lecture'` or `type='conf'`: `presenterId` references `supervisors.id`
- **Enforced at application level**, not database level

**Character Set**: `utf8mb4_unicode_ci`

#### `event_attendance`
Attendance records for events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `char(36)` | PRIMARY KEY | UUID |
| `eventId` | `char(36)` | NOT NULL | FK → `events.id` |
| `candidateId` | `char(36)` | NOT NULL | FK → `candidates.id` |
| `addedBy` | `char(36)` | NOT NULL | **Polymorphic** - see notes below |
| `addedByRole` | `enum` | NOT NULL | Role: 'instituteAdmin', 'supervisor', 'candidate' |
| `flagged` | `boolean` | DEFAULT false | Is attendance flagged |
| `flaggedBy` | `char(36)` | NULLABLE | **Polymorphic** - see notes below |
| `flaggedAt` | `datetime` | NULLABLE | Flag timestamp |
| `points` | `int` | DEFAULT 1 | Points awarded |
| `createdAt` | `datetime` | NOT NULL | Auto-generated |

**Foreign Keys**:
- `eventId` → `events.id` (ON DELETE CASCADE)
- `candidateId` → `candidates.id` (ON DELETE RESTRICT)
- `addedBy` → **NO FK CONSTRAINT** (polymorphic - see below)
- `flaggedBy` → **NO FK CONSTRAINT** (polymorphic - see below)

**Unique Constraint**: `(eventId, candidateId)` - One attendance record per candidate per event

**Polymorphic Relationships**:
- **`addedBy`**: Can reference `institute_admins.id`, `supervisors.id`, or `candidates.id` based on `addedByRole`
- **`flaggedBy`**: Can reference `institute_admins.id`, `supervisors.id`, or `candidates.id`
- **Enforced at application level**, not database level

**Character Set**: `utf8mb4_unicode_ci`

---

## Relationships & Foreign Keys

### Foreign Key Constraints Summary

| Table | Column | References | On Delete | Notes |
|-------|--------|------------|-----------|-------|
| `cal_surgs` | `hospitalId` | `hospitals.id` | RESTRICT | |
| `cal_surgs` | `arabProcId` | `arab_procs.id` | RESTRICT | Nullable |
| `submissions` | `candDocId` | `candidates.id` | RESTRICT | |
| `submissions` | `procDocId` | `cal_surgs.id` | RESTRICT | |
| `submissions` | `supervisorDocId` | `supervisors.id` | RESTRICT | |
| `submissions` | `mainDiagDocId` | `main_diags.id` | RESTRICT | |
| `confs` | `presenterId` | `supervisors.id` | RESTRICT | |
| `events` | `lectureId` | `lectures.id` | RESTRICT | Nullable |
| `events` | `journalId` | `journals.id` | RESTRICT | Nullable |
| `events` | `confId` | `confs.id` | RESTRICT | Nullable |
| `event_attendance` | `eventId` | `events.id` | CASCADE | Deletes attendance when event deleted |
| `event_attendance` | `candidateId` | `candidates.id` | RESTRICT | |

### Many-to-Many Join Tables

| Join Table | Columns | Purpose |
|------------|---------|---------|
| `main_diag_diagnoses` | `mainDiagId`, `diagnosisId` | Links main diagnoses to ICD codes |
| `main_diag_procs` | `mainDiagId`, `procCptId` | Links main diagnoses to CPT codes |
| `submission_proc_cpts` | `submissionId`, `procCptId` | Links submissions to CPT codes |
| `submission_icds` | `submissionId`, `icdId` | Links submissions to ICD codes |

---

## Polymorphic Relationships

### Overview
Some relationships in the database are **polymorphic**, meaning a single column can reference multiple tables depending on context. These relationships are **not enforced at the database level** but are validated in application logic.

### 1. `events.presenterId`
**Context**: Event presenter can be different user types depending on event type.

| Event Type | `presenterId` References |
|------------|-------------------------|
| `lecture` | `supervisors.id` |
| `conf` | `supervisors.id` |
| `journal` | `candidates.id` |

**Implementation**:
- No foreign key constraint in database
- Application logic validates based on `events.type`
- Service/Provider layer enforces correct relationship

### 2. `event_attendance.addedBy`
**Context**: Attendance can be added by different user roles.

| `addedByRole` | `addedBy` References |
|---------------|---------------------|
| `instituteAdmin` | `institute_admins.id` |
| `supervisor` | `supervisors.id` |
| `candidate` | `candidates.id` |

**Implementation**:
- No foreign key constraint in database
- `addedByRole` enum column indicates which table to query
- Application logic validates relationship

### 3. `event_attendance.flaggedBy`
**Context**: Attendance can be flagged by any user role.

**Possible References**:
- `institute_admins.id`
- `supervisors.id`
- `candidates.id`

**Implementation**:
- No foreign key constraint in database
- Application logic queries appropriate table based on context
- Can be NULL (if not flagged)

### Best Practices for Polymorphic Relationships
1. **Always validate in application code** before inserting/updating
2. **Use TypeORM relations carefully** - avoid eager loading polymorphic fields
3. **Query explicitly** - don't rely on ORM magic for polymorphic fields
4. **Document in code** - add comments explaining which table is referenced

---

## Data Types & Conventions

### Primary Keys
- **Type**: `char(36)` (UUID v4)
- **Format**: Standard UUID format (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- **Generation**: Using `uuid` npm package (`v4 as uuidv4`)

### Foreign Keys
- **Type**: `char(36)` (UUID)
- **Naming**: `{tableName}Id` (e.g., `candDocId`, `procDocId`)
- **Nullable**: Only when relationship is optional

### Text Fields
- **Short Text**: `varchar(255)` or `varchar(100)` for names, titles
- **Long Text**: `text` for descriptions, notes
- **Character Set**: `utf8mb4` with `utf8mb4_unicode_ci` collation for Arabic support

### JSON Columns
Used for:
- **Arrays**: `diagnosisName`, `procedureName`, `neuroLogName`
- **Objects**: `location` (coordinates)

**Example**:
```json
// diagnosisName
["Brain Tumor", "Malignant Glioma"]

// location
{"long": 31.2357, "lat": 30.0444}
```

### Enums
- **Status Fields**: `enum('approved', 'pending', 'rejected')`
- **Event Types**: `enum('lecture', 'journal', 'conf')`
- **Event Status**: `enum('booked', 'held', 'canceled')`
- **Gender**: `enum('male', 'female')`
- **User Roles**: Defined in `UserRole` enum

### Timestamps
- **`createdAt`**: Auto-generated on insert (`CURRENT_TIMESTAMP`)
- **`updatedAt`**: Auto-updated on modify (`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
- **Custom Timestamps**: `datetime` type for user-controlled timestamps

### Boolean Fields
- **Type**: `boolean` (stored as `TINYINT(1)`)
- **Default**: Usually `false` for approval flags, `true` for enabled flags

---

## Indexes & Constraints

### Primary Keys
All tables have UUID primary keys (`id` column).

### Unique Constraints

| Table | Column(s) | Purpose |
|-------|-----------|---------|
| `candidates` | `email` | One account per email |
| `supervisors` | `email` | One account per email |
| `institute_admins` | `email` | One account per email |
| `super_admins` | `email` | One account per email |
| `lectures` | `google_uid` | Unique Google Sheets identifier |
| `journals` | `google_uid` | Unique Google Sheets identifier |
| `confs` | `google_uid` | Unique Google Sheets identifier |
| `submissions` | `subGoogleUid` | Unique Google Sheets identifier |
| `event_attendance` | `(eventId, candidateId)` | One attendance record per candidate per event |

### Indexes
- **Foreign Key Columns**: Automatically indexed by MariaDB
- **Unique Constraints**: Automatically indexed
- **Composite Index**: `event_attendance(eventId, candidateId)` for uniqueness

### Check Constraints
None currently defined. Validation is performed at application level.

---

## Migration Notes

### Migration Strategy
The database was migrated component-by-component from MongoDB to MariaDB:

1. **Reference Tables**: Hospitals, Diagnoses, Proc CPTs, Arab Procs
2. **User Tables**: Candidates, Supervisors, Institute Admins, Super Admins
3. **Clinical Data**: Main Diags, Cal Surgs, Submissions
4. **Educational Content**: Lectures, Journals, Confs
5. **Events**: Events, Event Attendance

### Key Migration Challenges

#### 1. ObjectId to UUID Conversion
- **MongoDB**: Used `ObjectId` (24-character hex string)
- **MariaDB**: Uses UUID (36-character string with hyphens)
- **Solution**: Created mapping tables during migration to convert ObjectIds to UUIDs

#### 2. Nested Arrays
- **MongoDB**: Native array support
- **MariaDB**: Converted to:
  - **Many-to-Many relationships** (for relational data): Using join tables
  - **JSON columns** (for simple arrays): Stored as JSON

#### 3. Polymorphic Relationships
- **MongoDB**: Flexible document structure
- **MariaDB**: Stored as UUIDs without FK constraints, validated in application

#### 4. Embedded Documents
- **MongoDB**: Nested objects (e.g., `location`, `attendance` array)
- **MariaDB**: 
  - **Simple objects**: JSON columns (e.g., `location`)
  - **Complex relationships**: Separate tables (e.g., `event_attendance`)

### Data Integrity
- All foreign keys use `ON DELETE RESTRICT` to prevent orphaned records
- Exception: `event_attendance.eventId` uses `ON DELETE CASCADE` (attendance deleted when event deleted)
- Unique constraints ensure data consistency

---

## Best Practices

### 1. UUID Usage
- **Always use UUIDs** for primary keys
- **Generate using `uuidv4()`** from `uuid` package
- **Never use auto-increment integers** for new tables

### 2. Foreign Key Management
- **Use `ON DELETE RESTRICT`** by default to prevent accidental data loss
- **Use `ON DELETE CASCADE`** only when child records are meaningless without parent
- **Never use `ON DELETE SET NULL`** for required relationships

### 3. Character Encoding
- **Always use `utf8mb4_unicode_ci`** for text columns that may contain Arabic
- **Specify charset explicitly** in TypeORM column definitions
- **Test with Arabic text** to ensure proper storage and retrieval

### 4. JSON Columns
- **Use for simple arrays/objects** that don't need relational queries
- **Avoid for complex nested structures** - consider normalization
- **Validate JSON structure** in application code

### 5. Polymorphic Relationships
- **Document in code comments** which table is referenced
- **Validate in Provider/Service layer** before database operations
- **Never add FK constraints** for polymorphic fields
- **Use explicit queries** rather than ORM relations

### 6. Timestamps
- **Use `@CreateDateColumn()` and `@UpdateDateColumn()`** for automatic timestamps
- **Use `datetime` type** for user-controlled timestamps
- **Never manually set `createdAt`** - let database handle it

### 7. Enums
- **Define enums in TypeScript** and use in TypeORM
- **Keep enum values consistent** across application
- **Document enum meanings** in code comments

### 8. Transactions
- **Use transactions** for multi-table operations
- **Handle rollback** on errors
- **Check `isTransactionActive`** before commit/rollback

### 9. Query Performance
- **Index foreign key columns** (automatic in MariaDB)
- **Use composite indexes** for frequently queried column combinations
- **Avoid N+1 queries** - use `JOIN` or `relations` in TypeORM

### 10. Data Migration
- **Test migrations on staging** before production
- **Backup data** before running migrations
- **Verify data integrity** after migration
- **Use transactions** for data migration scripts

---

## Environment Variables

Required environment variables for database connection:

```env
SQL_HOST=localhost
SQL_PORT=3306
SQL_DB_NAME=medscribeneuro
SQL_USERNAME=your_username
SQL_PASSWORD=your_password
NODE_ENV=development  # Optional, affects logging
```

---

## TypeORM Configuration

### Entity Registration
All entities are registered in `src/config/database.config.ts`:

```typescript
entities: [
  __dirname + "/../hospital/hospital.mDbSchema.ts",
  __dirname + "/../diagnosis/diagnosis.mDbSchema.ts",
  // ... all other entities
]
```

### Synchronization
- **`synchronize: false`** - NEVER set to `true` in production
- **Use migrations** for schema changes
- **Migrations location**: `src/migrations/*.ts`

### Connection Pool
- **Connection Limit**: 10 connections
- **Connection Timeout**: 10 seconds
- **Auto-reconnect**: Handled by TypeORM

---

## Maintenance & Troubleshooting

### Common Issues

#### 1. Foreign Key Constraint Violations
**Error**: `Cannot delete or update a parent row: a foreign key constraint fails`

**Solution**: 
- Check for child records referencing the parent
- Delete child records first, or use `ON DELETE CASCADE` if appropriate
- Use `ON DELETE RESTRICT` to prevent accidental deletions

#### 2. Character Encoding Issues
**Error**: Arabic text appears as question marks or garbled

**Solution**:
- Verify column uses `utf8mb4_unicode_ci` collation
- Check connection charset in TypeORM config
- Ensure application uses UTF-8 encoding

#### 3. UUID Format Errors
**Error**: Invalid UUID format

**Solution**:
- Use `uuidv4()` from `uuid` package
- Ensure UUIDs are 36 characters with hyphens
- Never use MongoDB ObjectIds as UUIDs

#### 4. Polymorphic Relationship Errors
**Error**: Referenced record not found

**Solution**:
- Validate relationship in application code before database operation
- Check `type` or `role` field to determine correct table
- Query appropriate table based on context

---

## Future Considerations

### Potential Improvements
1. **Full-Text Search**: Add full-text indexes for searchable text fields
2. **Audit Logging**: Consider adding audit tables for critical operations
3. **Soft Deletes**: Consider `deletedAt` columns instead of hard deletes
4. **Partitioning**: Consider table partitioning for large tables (e.g., `submissions`)
5. **Read Replicas**: Consider read replicas for reporting queries

### Schema Evolution
- **Always use migrations** for schema changes
- **Test migrations** on staging environment
- **Document breaking changes** in migration files
- **Version control** all schema changes

---

## Contact & Support

For questions or issues related to the database architecture:
1. Review this documentation
2. Check TypeORM entity definitions in `src/**/*.mDbSchema.ts`
3. Review migration files in `src/migrations/`
4. Consult application code in Provider/Service layers

---

**Last Updated**: 2025-01-27  
**Database Version**: MariaDB 10.x  
**ORM Version**: TypeORM 0.3.x
