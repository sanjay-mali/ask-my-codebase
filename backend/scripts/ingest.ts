import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { env } from "../src/config/env";
import { qdrant } from "../src/clients";
import { embedBatch } from "../src/services/embed";

async function ingestCodebase(path: string) {
  console.log(`Loading files from ${path}`);
  const loader = new DirectoryLoader(
    path,
    {
      ".ts": (p: string) => new TextLoader(p),
      ".tsx": (p: string) => new TextLoader(p),
      ".js": (p: string) => new TextLoader(p),
      ".jsx": (p: string) => new TextLoader(p),
      ".json": (p: string) => new TextLoader(p),
      ".md": (p: string) => new TextLoader(p),
    },
    true,
  );

  const docs = await loader.load();

  console.log(`Loaded ${docs.length} files`);

  const spliter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
    separators: ["\n\nclass", "\n\nfunction", "\n", ""],
  });

  const allPoints: any[] = [];
  for (const doc of docs) {
    const chunks = await spliter.splitText(doc.pageContent);
    const embeddings = await embedBatch(chunks);

    chunks.forEach((chunk, i) => {
      const vector = embeddings?.[i];

      if (!vector) return;

      allPoints.push({
        id: allPoints.length,
        vector,
        payload: { content: chunk, source: doc.metadata.source },
      });
    });
  }

  try {
    await qdrant.upsert(env.qdrantCollection, {
      points: allPoints,
    });
  } catch (err: any) {
    console.dir(err.data, { depth: null });
    throw err;
  }
  console.log(`Indexed ${allPoints.length} chunks from ${docs.length} files`);
}

const targetPath = process.argv[2] ?? "../backend/src";

ingestCodebase(targetPath);
