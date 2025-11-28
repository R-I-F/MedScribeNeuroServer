const SERVER_HOSTNAME = process.env.HOSTNAME || "localhost";
const SERVER_PORT = process.env.PORT || 3001;
const SERVER_TOKEN_EXPIRETIME = process.env.SERVER_TOKEN_EXPIRETIME || 3600;
const SERVER_REFRESH_TOKEN_EXPIRETIME = process.env.SERVER_REFRESH_TOKEN_EXPIRETIME || 604800; // 7 days in seconds
const SERVER_TOKEN_ISSUER = process.env.SERVER_TOKEN_ISSUER || "medscribe.neuro.qasrelainy";
const SERVER_TOKEN_SECRET = process.env.SERVER_TOKEN_SECRET || "supersecretkey";
const SERVER_REFRESH_TOKEN_SECRET = process.env.SERVER_REFRESH_TOKEN_SECRET || SERVER_TOKEN_SECRET + "_refresh";

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