import "reflect-metadata";
import express, { Express, Request, Response } from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import { addRoutes } from "./config/routes.config";
import { responseFormatter } from "./middleware/responseFormatter";
import { initializeDatabase, validateDatabaseConfig } from "./config/database.config";


const app: Express = express();
dotenv.config();
const port = process.env.PORT;

// Trust proxy - required for proper IP address handling (especially IPv6)
// This ensures req.ip is properly normalized and prevents IPv6 bypass issues in rate limiting
app.set('trust proxy', true);

// CORS configuration
// When credentials: true, origin cannot be "*" - must be specific origin
const allowedOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({
  origin: allowedOrigin, // Specific origin required when credentials: true
  credentials: true, // Allow cookies/credentials - REQUIRED for httpOnly cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

app.use(express.json());
app.use(cookieParser()); // Parse httpOnly cookies
app.use(responseFormatter);

async function bootstrap() {
  try {
    // Initialize MariaDB connection
    validateDatabaseConfig();
    await initializeDatabase();
    
    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Bootstrap error:", err);
    process.exit(1);
  }
}
addRoutes(app);
bootstrap();
