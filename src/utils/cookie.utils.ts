import { Response } from "express";
import config from "../config/server.config";

/**
 * Set authentication cookies (access token and refresh token)
 */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  const cookieOptions = {
    httpOnly: config.server.cookie.httpOnly,
    secure: config.server.cookie.secure,
    sameSite: config.server.cookie.sameSite,
    path: config.server.cookie.path,
    maxAge: Number(config.server.token.expireTime) * 1000, // Convert to milliseconds
  };

  const refreshCookieOptions = {
    ...cookieOptions,
    maxAge: Number(config.server.refreshToken.expireTime) * 1000, // Convert to milliseconds
  };

  res.cookie("auth_token", accessToken, cookieOptions);
  res.cookie("refresh_token", refreshToken, refreshCookieOptions);
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(res: Response): void {
  const cookieOptions = {
    httpOnly: config.server.cookie.httpOnly,
    secure: config.server.cookie.secure,
    sameSite: config.server.cookie.sameSite,
    path: config.server.cookie.path,
    maxAge: 0,
  };

  res.clearCookie("auth_token", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);
}

