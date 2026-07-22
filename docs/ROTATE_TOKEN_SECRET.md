# Rotating the JWT token secret (production)

**Date prepared:** 2026-07-23
**Why:** the old `SERVER_TOKEN_SECRET` was a weak 10-character value. JWTs are signed with it, and a short secret can be cracked offline (rate limiting does not help against offline cracking). A cracked secret lets an attacker forge any token, including a super-admin one. This replaces it with a strong 256-bit random secret and adds a separate secret for refresh tokens.

**No em-dashes anywhere (standing rule).**

---

## Status

| Step | What | Status |
|------|------|--------|
| 1 | Generate two 256-bit random secrets | DONE (2026-07-23) |
| 2 | Update local `.env` (gitignored) with both | DONE (2026-07-23) |
| 3 | Verify locally (boot clean, old tokens rejected, new accepted) | DONE (2026-07-23) |
| 4 | Restart local dev server to pick up the new secret | YOU DO (optional, when convenient) |
| 5 | Set the two variables on Railway (production) | DONE (2026-07-23, user) |
| 6 | Verify on the live site after redeploy | DONE (2026-07-23, user confirmed login works) |

**Rotation COMPLETE.** Production now signs tokens with the strong secret. The old weak secret is retired.

---

## The new values

> **The actual secret values are NOT written in this file on purpose.** They are real production secrets, so they must never live in git. They are stored in your gitignored local `.env` (`SERVER_TOKEN_SECRET`, `SERVER_REFRESH_TOKEN_SECRET`) and on Railway. Copy them from your local `.env` into Railway.

- `SERVER_TOKEN_SECRET`: signs and verifies access tokens. This one already existed on Railway with the old weak value. Replace it with the new 256-bit hex value from your `.env`.
- `SERVER_REFRESH_TOKEN_SECRET`: signs and verifies refresh tokens. You did NOT have this before (the code used to derive it from the access secret). Add it with the new value from your `.env` so refresh tokens get their own independent secret.

Keep these secret. They are gitignored locally and must never be committed or shared.

---

## What happens when it goes live

- **Everyone currently logged in gets logged out, one time.** Every existing token was signed with the old secret, so all of them become invalid at the same instant. Users simply log in again and receive a fresh token. Nothing else is disrupted and no data is touched.
- There is no grace period. The app uses a single secret, so it cannot accept the old and new secret at the same time. It is a clean cutover of a few seconds plus the Railway redeploy time.
- This is pure environment config. There is NO code change, so nothing to commit or deploy from the repo for this rotation.

## When to do it

Pick a quiet time with few active users. A heads-up to users that they may need to log in again is nice but not required.

---

## Step by step (Railway, production)

1. Open your backend service in Railway.
2. Go to the **Variables** tab.
3. Find `SERVER_TOKEN_SECRET` and replace its value with the new `SERVER_TOKEN_SECRET` above.
4. Click to add a new variable. Name it `SERVER_REFRESH_TOKEN_SECRET` and paste the new refresh value above.
5. Save. Railway redeploys the backend automatically.
6. Wait for the deploy to finish. The rotation is now live.

## Verify after it is live

1. Open the production site. If you were logged in, confirm you are now logged out.
2. Log in fresh. It should work normally.
3. That confirms the new secret is signing and validating tokens correctly.

## Local dev (optional)

Your local `.env` already has the new values. Your running dev server on `:3001` keeps the old secret until you restart it (nodemon watches `src/` only, not `.env`). Restart `npm run start:dev` when convenient to pick it up. Restarting logs out local sessions, which is expected.

## If something goes wrong (rollback)

If logins had failed after the rotation, the fallback would have been to restore the previous `SERVER_TOKEN_SECRET` value on Railway and remove `SERVER_REFRESH_TOKEN_SECRET`. This was not needed: the user verified login works in production after the rotation. The old secret is now retired and should not be reused.

---

## Local verification already done (2026-07-23)

On a throwaway instance with the new secrets:
- Server booted clean, the boot security check passed.
- A token signed with the OLD secret was rejected (401).
- A token signed with the NEW secret was accepted (200).
