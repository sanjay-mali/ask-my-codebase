import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "../config/env";

export const qdrant = new QdrantClient({
  url: env.qdrantUrl,
});
