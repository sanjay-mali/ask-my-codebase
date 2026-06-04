import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface TokenPayload {
  id: string;
}

export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: "7d" });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
};
