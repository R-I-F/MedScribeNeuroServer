-- One-time: remove expires_at from wa_session_routing (TTL lives on tenant whatsapp_sessions).
-- Fails if the column was never created (safe to skip in that case).
--
--   npx ts-node sql/run-alter-wa-session-routing-drop-expires.ts

ALTER TABLE `wa_session_routing` DROP COLUMN `expires_at`;
