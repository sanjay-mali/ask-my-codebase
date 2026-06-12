import type { Request, Response, NextFunction } from "express";

const MAX_CONTENT_LENGTH = 20 * 1024 * 1024;

const ipRequests = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_LIMIT = 100;

export function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const ip =
    (req.headers["x-forwarded-for"] as string) ||
    req.ip ||
    req.socket.remoteAddress ||
    "unknown";
  const now = Date.now();
  const requestInfo = ipRequests.get(ip);

  if (!requestInfo || now > requestInfo.resetTime) {
    ipRequests.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    next();
  } else {
    requestInfo.count++;
    if (requestInfo.count > MAX_LIMIT) {
      res
        .status(429)
        .json({ error: "Too many requests, please try again later." });
      return;
    }
    next();
  }
}

export function contentLengthValidator(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const contentLength = req.headers["content-length"];
  if (contentLength) {
    const length = parseInt(contentLength, 10);
    if (isNaN(length) || length > MAX_CONTENT_LENGTH) {
      res.status(413).json({ error: "Payload too large. Limit is 20MB." });
      return;
    }
  }
  next();
}
