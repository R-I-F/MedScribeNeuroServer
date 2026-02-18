import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

/**
 * Helper function to extract and normalize IP address for rate limiting
 * Uses express-rate-limit's ipKeyGenerator helper to properly handle IPv6 addresses
 * This satisfies express-rate-limit's validation requirements
 */
function getIpForRateLimit(req: Request): string {
  // Get IP from request (normalized by Express when trust proxy is set)
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  // Use ipKeyGenerator helper to properly handle IPv6 addresses
  // This satisfies express-rate-limit's validation that requires ipKeyGenerator usage
  return ipKeyGenerator(ip);
}

/**
 * Global IP rate limiter (applied to all requests in index.ts).
 * Limits each IP to 400 requests per 15 minutes across the whole app.
 * Throttles bots/scanners that hit many paths; per-route limiters provide finer limits.
 */
export const globalIpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
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
  keyGenerator: (req: Request) => {
    // Try to extract user ID from JWT token
    try {
      const token = req.cookies?.auth_token || 
                    req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
                    req.headers.authorization;
      
      if (token) {
        // Decode without verification (verification happens in extractJWT middleware)
        const decoded = jwt.decode(token) as any;
        const userId = decoded?.id || decoded?._id;
        
        if (userId) {
          return `user:${userId}`;
        }
      }
    } catch (error) {
      // If JWT decode fails, fall back to IP
    }
    
    // Fallback to IP address if no valid token found
    // Use ipKeyGenerator helper to properly handle IPv6 addresses
    // This satisfies express-rate-limit's validation requirements
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `ip:${ipKeyGenerator(ip)}`;
  },
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
  keyGenerator: (req: Request) => {
    // Try to extract user ID from JWT token
    try {
      const token = req.cookies?.auth_token || 
                    req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
                    req.headers.authorization;
      
      if (token) {
        // Decode without verification (verification happens in extractJWT middleware)
        const decoded = jwt.decode(token) as any;
        const userId = decoded?.id || decoded?._id;
        
        if (userId) {
          return `user:${userId}`;
        }
      }
    } catch (error) {
      // If JWT decode fails, fall back to IP
    }
    
    // Fallback to IP address if no valid token found
    // Use ipKeyGenerator helper to properly handle IPv6 addresses
    // This satisfies express-rate-limit's validation requirements
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `ip:${ipKeyGenerator(ip)}`;
  },
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
