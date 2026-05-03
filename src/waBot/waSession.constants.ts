/** Tenant whatsapp_sessions.conversation_state values used by WaBot. */
export const WA_CONV_MAIN_MENU = "main_menu";
export const WA_CONV_ROLE_PICK = "role_pick";
export const WA_CONV_AWAITING_ID = "awaiting_id_upload";
/** Set after we link a recognized candidate/supervisor; placeholder until the real user menu lands. */
export const WA_CONV_USER_HOME = "user_home";

/** TTL for union ID upload after signup link (matches prior in-memory behavior). */
export const WA_ID_UPLOAD_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Reply button id prefix for institution picker (`inst_<uuid>`). */
export const WA_INST_BUTTON_PREFIX = "inst_";
