import "reflect-metadata";
import express, { Express, Request, Response } from "express";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import { addRoutes } from "./config/routes.config";
import { responseFormatter } from "./middleware/responseFormatter";

const app: Express = express();
dotenv.config();
const port = process.env.PORT;

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
  if (!process.env.MONGODB_URL) {
    throw new Error("Cannot read environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      dbName: process.env.DB_NAME,
    });
    app.listen(port, () => {
      // Server started successfully
    });
  } catch (err) {
    process.exit(1);
  }
}
addRoutes(app);
bootstrap();
