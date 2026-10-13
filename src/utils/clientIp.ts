import { Request } from "express";
import { isIP } from "net";

/**
 * The visitor's real IP address.
 *
 * Production traffic reaches the API as browser -> Cloudflare -> Netlify (/api/* proxy)
 * -> Railway edge -> app. With `trust proxy = 1`, `req.ip` is the Netlify server that
 * forwarded the request, so every user shares a handful of addresses. That made the
 * IP-based rate limiters app-wide buckets (one busy period throttled everyone) and made
 * the IP stored on login events meaningless.
 *
 * Order: Cloudflare's CF-Connecting-IP, then Netlify's X-Nf-Client-Connection-Ip, then
 * req.ip. A header value is used only when it parses as an IP address.
 *
 * Note: the Railway origin is publicly reachable, so these headers can be forged by a
 * client calling it directly. That only lets such a client pick its own rate-limit bucket;
 * the per-user limiters and JWT checks are unaffected.
 */
export function getClientIp(req: Request): string {
  for (const name of ["cf-connecting-ip", "x-nf-client-connection-ip"]) {
    const raw = req.headers[name];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (value && isIP(value)) return value;
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}
