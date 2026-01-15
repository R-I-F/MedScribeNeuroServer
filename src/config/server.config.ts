// Load environment variables FIRST before reading them
import * as dotenv from "dotenv";
dotenv.config();

const SERVER_HOSTNAME = process.env.HOSTNAME || "localhost";
const SERVER_PORT = process.env.PORT || 3001;
const SERVER_TOKEN_EXPIRETIME = process.env.SERVER_TOKEN_EXPIRETIME || 3600;
const SERVER_REFRESH_TOKEN_EXPIRETIME = process.env.SERVER_REFRESH_TOKEN_EXPIRETIME || 604800; // 7 days in seconds
const SERVER_TOKEN_ISSUER = process.env.SERVER_TOKEN_ISSUER || "medscribe.neuro.qasrelainy";
const SERVER_TOKEN_SECRET = process.env.SERVER_TOKEN_SECRET || "supersecretkey";
const SERVER_REFRESH_TOKEN_SECRET = process.env.SERVER_REFRESH_TOKEN_SECRET || SERVER_TOKEN_SECRET + "_refresh";

// Helper function to format seconds into human-readable time
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 
      ? `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`
      : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return remainingMinutes > 0
      ? `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
      : `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(seconds / 86400);
    const remainingHours = Math.floor((seconds % 86400) / 3600);
    return remainingHours > 0
      ? `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`
      : `${days} day${days !== 1 ? 's' : ''}`;
  }
}

// Log token expiration times on server start
console.log("=".repeat(60));
console.log("[Server Config] Token Expiration Configuration:");
console.log(`  Access Token Expiration: ${SERVER_TOKEN_EXPIRETIME} seconds (${formatTime(Number(SERVER_TOKEN_EXPIRETIME))})`);
console.log(`  Refresh Token Expiration: ${SERVER_REFRESH_TOKEN_EXPIRETIME} seconds (${formatTime(Number(SERVER_REFRESH_TOKEN_EXPIRETIME))})`);
console.log("=".repeat(60));

const SERVER = {
  hostname: SERVER_HOSTNAME,
  port: SERVER_PORT,
  token: {
    expireTime: SERVER_TOKEN_EXPIRETIME,
    issuer: SERVER_TOKEN_ISSUER,
    secret: SERVER_TOKEN_SECRET,
  },
  refreshToken: {
    expireTime: SERVER_REFRESH_TOKEN_EXPIRETIME,
    secret: SERVER_REFRESH_TOKEN_SECRET,
  },
  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: (process.env.COOKIE_SAME_SITE || "strict") as "strict" | "lax" | "none",
    httpOnly: true,
    path: "/",
  }
};

const config = {
  server: SERVER,
}

export default config;