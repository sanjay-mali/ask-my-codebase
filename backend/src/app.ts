import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { askRouter } from "./routes/ask";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/user";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);
  app.use("/ask", askRouter);
  app.use("/auth", authRouter);
  app.use("/", userRouter);

  return app;
}
