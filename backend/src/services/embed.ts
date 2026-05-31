import { googleGenAI } from "../clients";

export async function embedBatch(chunks: string[]) {
  const embeddings = await Promise.all(
    chunks.map(async (chunk) => {
      const response = await googleGenAI.models.embedContent({
        model: "gemini-embedding-2",
        contents: chunk,
        config: { outputDimensionality: 1536 },
      });
      return response.embeddings?.[0]?.values;
    }),
  );

  return embeddings;
}
