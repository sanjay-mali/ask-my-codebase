import { googleGenAI, qdrant } from "../clients";
import { env } from "../config/env";

export async function retrieveContext(q: string) {
  const response = await googleGenAI.models.embedContent({
    model: "gemini-embedding-2",
    contents: q,
    config: { outputDimensionality: 1536 },
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding) {
    throw new Error("Failed to generate embedding");
  }

  const result = await qdrant.search(env.qdrantCollection, {
    vector: embedding,
    limit: env.retrievalLimit,
    with_payload: true,
    score_threshold: env.scoreThreshold,
  });

  return result;
}
