import { PrismaClient } from "../../../prisma/generated/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../../config/env.ts";

const connectionString = env.databaseUrl;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
