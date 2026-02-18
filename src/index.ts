import "reflect-metadata";
import express, { Express, Request, Response, NextFunction } from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import { addRoutes } from "./config/routes.config";
import { responseFormatter } from "./middleware/responseFormatter";
import { requestLogger } from "./middleware/requestLogger.middleware";
import { globalErrorHandler } from "./middleware/globalErrorHandler.middleware";
import { initializeDatabase, validateDatabaseConfig } from "./config/database.config";

dotenv.config();
const port = process.env.PORT;

// Process-level safety net: log and exit so a process manager can restart
process.on("unhandledRejection", (reason, promise) => {
  console.error("[App] Unhandled rejection:", reason, promise);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("[App] Uncaught exception:", err);
  process.exit(1);
});

const app: Express = express();
console.log("[App] Process started", { PORT: port, NODE_ENV: process.env.NODE_ENV });

// Trust proxy - use 1 (not true) to avoid ERR_ERL_PERMISSIVE_TRUST_PROXY.
// With true, clients could spoof X-Forwarded-For and bypass IP-based rate limiting.
// With 1, we trust only the first proxy (e.g. nginx); req.ip comes from that proxy safely.
app.set('trust proxy', 1);

// CORS configuration
// When credentials: true, origin cannot be "*" - must be specific origin
const allowedOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({
  origin: allowedOrigin, // Specific origin required when credentials: true
  credentials: true, // Allow cookies/credentials - REQUIRED for httpOnly cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Institution-Id"],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

app.use(express.json());
app.use(cookieParser()); // Parse httpOnly cookies
app.use(requestLogger);
app.use(responseFormatter);

async function bootstrap() {
  try {
    console.log("[App] Bootstrap starting...");
    validateDatabaseConfig();
    console.log("[App] Database config OK, connecting...");
    await initializeDatabase();
    console.log("[App] Database connected, binding port...");
    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
    });
  } catch (err) {
    console.error("[App] Bootstrap error:", err);
    process.exit(1);
  }
}
addRoutes(app);

// 404 catch-all: no route matched; pass to global error handler for consistent JSON shape
app.use((req: Request, res: Response, next: NextFunction) => {
  next(Object.assign(new Error("Not Found"), { status: 404 }));
});
app.use(globalErrorHandler);

bootstrap();
