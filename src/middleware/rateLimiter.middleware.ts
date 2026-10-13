import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { getClientIp } from "../utils/clientIp";

/**
 * When set to "true", all rate limiters are skipped (for load testing).
 * Do not use in production.
 */
const skipRateLimit = () => process.env.DISABLE_RATE_LIMIT === "true";

/**
 * Rate-limit key for the visitor's real IP (see getClientIp: req.ip alone is the
 * Netlify proxy, shared by every user). ipKeyGenerator collapses IPv6 to its /56
 * subnet, as express-rate-limit requires.
 */
function ipKey(req: Request): string {
  return `ip:${ipKeyGenerator(getClientIp(req))}`;
}

/**
 * Rate-limit key per signed-in user, falling back to the real IP.
 * The token is decoded WITHOUT verification (extractJWT verifies later); a forged id only
 * picks a different bucket, it never grants access.
 */
function userOrIpKey(req: Request): string {
  try {
    const token = req.cookies?.auth_token ||
                  req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
                  req.headers.authorization;
    if (token) {
      const decoded = jwt.decode(token) as any;
      const userId = decoded?.id || decoded?._id;
      if (userId) return `user:${userId}`;
    }
  } catch (error) {
    // If JWT decode fails, fall back to IP
  }
  return ipKey(req);
}

/**
 * Global rate limiter (applied to all requests in index.ts).
 * 400 requests per 15 minutes per signed-in user, or per real IP for anonymous traffic.
 * Keyed by user because many doctors share one hospital network address.
 * Throttles bots/scanners that hit many paths; per-route limiters provide finer limits.
 */
export const globalIpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  skip: skipRateLimit,
  keyGenerator: userOrIpKey,
  message: {
    status: "error",
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: "Too Many Requests",
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      status: "error",
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      message: "Too Many Requests",
      error: "Too many requests from this IP, please try again later.",
    });
  },
});

/**
 * Standard API rate limiter (IP-based)
 * Limits requests to 200 requests per 15 minutes per IP
 * Suitable for public or unauthenticated endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  skip: skipRateLimit,
  keyGenerator: ipKey,
  message: {
    status: "error",
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: "Too Many Requests",
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      status: "error",
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      message: "Too Many Requests",
      error: "Too many requests from this IP, please try again later.",
    });
  },
});

/**
 * Health-check rate limiter (IP-based).
 * Limits GET /health to 60 requests per 15 minutes per IP (enough for LB probes, throttles bots).
 */
export const healthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  skip: skipRateLimit,
  keyGenerator: ipKey,
  message: {
    status: "error",
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: "Too Many Requests",
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      status: "error",
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      message: "Too Many Requests",
      error: "Too many requests from this IP, please try again later.",
    });
  },
});

/**
 * Strict API rate limiter (IP-based)
 * Limits requests to 50 requests per 15 minutes per IP
 * Suitable for write operations on public endpoints
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  skip: skipRateLimit,
  keyGenerator: ipKey,
  message: {
    status: "error",
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: "Too Many Requests",
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      status: "error",
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      message: "Too Many Requests",
      error: "Too many requests from this IP, please try again later.",
    });
  },
});

/**
 * Super-admin login rate limiter (IP-based) for POST /auth/superAdmin/login.
 * Tighter than strictRateLimiter (10 per 15 min per IP): super-admin is the
 * highest-value account and has no per-account lockout, so the login door is
 * throttled harder. See docs/SUPERADMIN_PRODUCTION_ENABLEMENT_PLAN.md (P3).
 */
export const superAdminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 super-admin login attempts per windowMs
  skip: skipRateLimit,
  keyGenerator: ipKey,
  message: {
    status: "error",
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: "Too Many Requests",
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      status: "error",
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      message: "Too Many Requests",
      error: "Too many requests from this IP, please try again later.",
    });
  },
});

/**
 * Demo-request rate limiter (IP-based) for POST /demoRequest only.
 * Tighter than strictRateLimiter (5 per 15 minutes per IP): the endpoint is
 * public and unauthenticated, and a legitimate visitor books a demo once.
 * Further abuse layers (honeypot, timing, per-email/per-IP caps, daily email
 * budget) live in src/demoRequest/ (see docs/BOOK_A_DEMO_PLAN.md).
 */
export const demoRequestRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 demo requests per windowMs
  skip: skipRateLimit,
  keyGenerator: ipKey,
  message: {
    status: "error",
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: "Too Many Requests",
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      status: "error",
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      message: "Too Many Requests",
      error: "Too many requests from this IP, please try again later.",
    });
  },
});

/**
 * Public semantic-search session rate limiter (IP-based) for POST /publicSearch/session only.
 * Tight (10 / 15 min per IP) because that route emails an OTP. The other public-search routes
 * (verify/resend/query) use strictRateLimiter; the real per-email query quota is a DB counter.
 * See docs/PUBLIC_SEMANTIC_SEARCH_TOOL_PLAN.md.
 */
export const publicSearchRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: skipRateLimit,
  keyGenerator: ipKey,
  message: {
    status: "error",
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: "Too Many Requests",
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      status: "error",
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      message: "Too Many Requests",
      error: "Too many requests from this IP, please try again later.",
    });
  },
});

/**
 * Lecture-eliminator reservation rate limiter (IP-based) for POST
 * /eliminator/:campaignId/reservations only. Public + unauthenticated, but a
 * legitimate supervisor submits a handful of times at most (initial pick +
 * any conflict retries) - 20/15min per IP is generous headroom without being
 * an open door for scripted claiming.
 */
export const eliminatorReserveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: skipRateLimit,
  keyGenerator: ipKey,
  message: {
    status: "error",
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: "Too Many Requests",
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      status: "error",
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      message: "Too Many Requests",
      error: "Too many requests from this IP, please try again later.",
    });
  },
});

/**
 * User-based API rate limiter (for authenticated endpoints)
 * Limits requests to 200 requests per 15 minutes per user
 * Uses JWT token to identify user, falls back to IP if no token
 * Suitable for authenticated GET endpoints
 */
export const userBasedRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each user to 200 requests per windowMs
  skip: skipRateLimit,
  keyGenerator: userOrIpKey,
  message: {
    status: "error",
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: "Too Many Requests",
    error: "Too many requests from this user, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      status: "error",
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      message: "Too Many Requests",
      error: "Too many requests from this user, please try again later.",
    });
  },
});

/**
 * User-based strict rate limiter (for authenticated endpoints)
 * Limits requests to 50 requests per 15 minutes per user
 * Uses JWT token to identify user, falls back to IP if no token
 * Suitable for authenticated write operations (POST, PUT, PATCH, DELETE)
 */
export const userBasedStrictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each user to 50 requests per windowMs
  skip: skipRateLimit,
  keyGenerator: userOrIpKey,
  message: {
    status: "error",
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: "Too Many Requests",
    error: "Too many requests from this user, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      status: "error",
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      message: "Too Many Requests",
      error: "Too many requests from this user, please try again later.",
    });
  },
});
