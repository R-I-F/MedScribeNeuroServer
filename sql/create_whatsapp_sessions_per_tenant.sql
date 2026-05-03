-- =============================================================================
-- WhatsApp sessions table — per-tenant MariaDB databases
-- SAFE: uses CREATE TABLE IF NOT EXISTS only. Does NOT drop, delete, truncate,
--       or alter existing objects.
--
-- Targets (see .env SQL_DB_DEF_NAME_*):
--   1) kasr-el-ainy           (SQL_DB_DEF_NAME_KA)
--   2) kasr-el-ainy-cts       (SQL_DB_DEF_NAME_KA_CTS)
--   3) masr-el-dawly          (SQL_DB_DEF_NAME_MD)
--   4) fayoum-university-ns   (SQL_DB_DEF_NAME_FNS)
--
-- Run as a user with CREATE privilege on each database, e.g.:
--   mysql -h HOST -P PORT -u USER -p < sql/create_whatsapp_sessions_per_tenant.sql
-- Or run each USE/CREATE block in your SQL client.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Kasr El Ainy Neurosurgery (SQL_DB_DEF_NAME_KA)
-- -----------------------------------------------------------------------------
USE `kasr-el-ainy`;

CREATE TABLE IF NOT EXISTS `whatsapp_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `wa_from` VARCHAR(32) NOT NULL COMMENT 'WhatsApp sender id from webhook (normalized)',
  `linked_user_id` CHAR(36) NULL DEFAULT NULL COMMENT 'App user UUID when resolved',
  `linked_role` ENUM('candidate','supervisor','unknown') NOT NULL DEFAULT 'unknown',
  `linked_candidate_id` CHAR(36) NULL DEFAULT NULL,
  `linked_supervisor_id` CHAR(36) NULL DEFAULT NULL,
  `conversation_state` VARCHAR(64) NOT NULL COMMENT 'e.g. main_menu, role_pick, awaiting_id_upload',
  `context_json` LONGTEXT NULL COMMENT 'JSON payload for bot/session context',
  `expires_at` DATETIME(3) NULL DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_whatsapp_sessions_wa_from` (`wa_from`),
  KEY `idx_whatsapp_sessions_state_expires` (`conversation_state`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2) Kasr El Ainy Cardiac and Thoracic Surgery (SQL_DB_DEF_NAME_KA_CTS)
-- -----------------------------------------------------------------------------
USE `kasr-el-ainy-cts`;

CREATE TABLE IF NOT EXISTS `whatsapp_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `wa_from` VARCHAR(32) NOT NULL COMMENT 'WhatsApp sender id from webhook (normalized)',
  `linked_user_id` CHAR(36) NULL DEFAULT NULL COMMENT 'App user UUID when resolved',
  `linked_role` ENUM('candidate','supervisor','unknown') NOT NULL DEFAULT 'unknown',
  `linked_candidate_id` CHAR(36) NULL DEFAULT NULL,
  `linked_supervisor_id` CHAR(36) NULL DEFAULT NULL,
  `conversation_state` VARCHAR(64) NOT NULL COMMENT 'e.g. main_menu, role_pick, awaiting_id_upload',
  `context_json` LONGTEXT NULL COMMENT 'JSON payload for bot/session context',
  `expires_at` DATETIME(3) NULL DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_whatsapp_sessions_wa_from` (`wa_from`),
  KEY `idx_whatsapp_sessions_state_expires` (`conversation_state`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3) Masr El Dawly (SQL_DB_DEF_NAME_MD)
-- -----------------------------------------------------------------------------
USE `masr-el-dawly`;

CREATE TABLE IF NOT EXISTS `whatsapp_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `wa_from` VARCHAR(32) NOT NULL COMMENT 'WhatsApp sender id from webhook (normalized)',
  `linked_user_id` CHAR(36) NULL DEFAULT NULL COMMENT 'App user UUID when resolved',
  `linked_role` ENUM('candidate','supervisor','unknown') NOT NULL DEFAULT 'unknown',
  `linked_candidate_id` CHAR(36) NULL DEFAULT NULL,
  `linked_supervisor_id` CHAR(36) NULL DEFAULT NULL,
  `conversation_state` VARCHAR(64) NOT NULL COMMENT 'e.g. main_menu, role_pick, awaiting_id_upload',
  `context_json` LONGTEXT NULL COMMENT 'JSON payload for bot/session context',
  `expires_at` DATETIME(3) NULL DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_whatsapp_sessions_wa_from` (`wa_from`),
  KEY `idx_whatsapp_sessions_state_expires` (`conversation_state`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4) Fayoum University Neurosurgery (SQL_DB_DEF_NAME_FNS)
-- -----------------------------------------------------------------------------
USE `fayoum-university-ns`;

CREATE TABLE IF NOT EXISTS `whatsapp_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `wa_from` VARCHAR(32) NOT NULL COMMENT 'WhatsApp sender id from webhook (normalized)',
  `linked_user_id` CHAR(36) NULL DEFAULT NULL COMMENT 'App user UUID when resolved',
  `linked_role` ENUM('candidate','supervisor','unknown') NOT NULL DEFAULT 'unknown',
  `linked_candidate_id` CHAR(36) NULL DEFAULT NULL,
  `linked_supervisor_id` CHAR(36) NULL DEFAULT NULL,
  `conversation_state` VARCHAR(64) NOT NULL COMMENT 'e.g. main_menu, role_pick, awaiting_id_upload',
  `context_json` LONGTEXT NULL COMMENT 'JSON payload for bot/session context',
  `expires_at` DATETIME(3) NULL DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_whatsapp_sessions_wa_from` (`wa_from`),
  KEY `idx_whatsapp_sessions_state_expires` (`conversation_state`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
