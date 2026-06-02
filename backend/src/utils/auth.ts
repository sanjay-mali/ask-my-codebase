import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateToken = (userId: number): string => {
  return jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: "1h" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.jwtSecret);
};
