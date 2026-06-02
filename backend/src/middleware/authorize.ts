import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function readToken(req: Request) {
  const bearerToken = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  return bearerToken ?? readCookie(req.headers.cookie, "token");
}

export function Authorize(req: Request, res: Response, next: NextFunction) {
  try {
    const token = readToken(req);

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const payload = verifyToken(token);

    req.user = {
      id: payload.id,
    };

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}
