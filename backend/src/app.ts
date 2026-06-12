import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { askRouter } from "./routes/ask";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { conversationRouter } from "./routes/conversation";
import { userRouter } from "./routes/user";
import { Authorize } from "./middleware/authorize";

import { rateLimiter, contentLengthValidator } from "./middleware/security";

export function createApp() {
  const app = express();

  if (process.env.NODE_ENV === "production" && env.corsOrigin === "*") {
    throw new Error("CORS_ORIGIN must be set explicitly in production.");
  }

  const corsOrigin =
    env.corsOrigin === "*"
      ? true
      : env.corsOrigin.split(",").map((origin) => origin.trim());

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );
  app.use(rateLimiter);
  app.use(contentLengthValidator);
  app.use(express.json({ limit: "20mb" }));

  app.use("/health", healthRouter);
  app.use("/ask", Authorize, askRouter);
  app.use("/conversation", Authorize, conversationRouter);
  app.use("/auth", authRouter);
  app.use("/", Authorize, userRouter);

  return app;
}
