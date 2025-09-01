import "reflect-metadata";
import express, { Express, Request, Response } from "express";
import mongoose from "mongoose";
import * as dotenv from "dotenv";

import { addRoutes } from "./config/routes.config";
import { responseFormatter } from "./middleware/responseFormatter";

const app: Express = express();
dotenv.config();
const port = process.env.PORT;
app.use(express.json());
app.use(responseFormatter);
// console.log(`${process.env.PROCLIST_SS}sheetName=${process.env.ARABPROCLIST_SS_NAME}`);

async function bootstrap() {
  console.log(process.env.MONGODB_URL);
  if (!process.env.MONGODB_URL) {
    throw new Error("Cannot read environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      dbName: process.env.DB_NAME,
    });
    console.log("connected to MongoDb");
    app.listen(port, () => {
      console.log(`App listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}
addRoutes(app);
bootstrap();
