-- =============================================================================
-- wa_session_routing — defaultdb only (SQL_DB_NAME_DEFAULT / SQL_*_DEFAULT)
-- Maps WhatsApp sender id (wa_from) -> institution UUID for multi-tenant routing.
-- SAFE: CREATE TABLE IF NOT EXISTS only. No DROP, DELETE, TRUNCATE, ALTER (destructive).
--
-- Run from repo root, e.g.:
--   npx ts-node sql/run-create-wa-session-routing.ts
-- =============================================================================

CREATE TABLE IF NOT EXISTS `wa_session_routing` (
  `wa_from` VARCHAR(32) NOT NULL COMMENT 'WhatsApp messages[].from (normalized)',
  `institution_id` CHAR(36) NOT NULL COMMENT 'Institutions.id UUID in defaultdb',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`wa_from`),
  KEY `idx_wa_session_routing_institution` (`institution_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
