import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

export type FileData = {
  name: string;
  mimeType: string;
  data: string;
};

export async function parseFilesToText(files: FileData[]): Promise<string> {
  if (!files || files.length === 0) return "";

  let combinedText = "";

  for (const file of files) {
    try {
      const buffer = Buffer.from(file.data, "base64");
      let extractedText = "";

      if (file.mimeType === "application/pdf") {
        const blob = new Blob([buffer]);
        const loader = new WebPDFLoader(blob);
        const docs = await loader.load();
        extractedText = docs.map((doc) => doc.pageContent).join("\n");
      } else {
        extractedText = buffer.toString("utf-8");
      }

      combinedText += `\n\n--- START OF ATTACHED FILE: ${file.name} ---\n`;
      combinedText += extractedText.trim();
      combinedText += `\n--- END OF ATTACHED FILE: ${file.name} ---\n`;
    } catch (err) {
      console.error(`Failed to parse file ${file.name}:`, err);
      combinedText += `\n\n--- FAILED TO PARSE ATTACHED FILE: ${file.name} ---\n`;
    }
  }

  return combinedText.trim();
}
