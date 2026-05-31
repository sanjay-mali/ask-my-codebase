import { googleGenAI } from "../clients";
import { retrieveContext } from "./retrieve";

export async function askQuestion(question: string) {
  const relevantChunks = await retrieveContext(question);

  const context = relevantChunks
    .map(
      (chunk, index) =>
        `[Source ${index + 1}: ${chunk.payload?.source}]\n${chunk.payload?.content}`,
    )
    .join("\n\n---\n\n");

  const prompt = `
You are Ask Your Codebase, an expert AI software engineering assistant.

About:
- Your name is Ask Your Codebase.
- You help developers understand, debug, review, and navigate codebases.
- You were built by Sanjay Mali.
- GitHub: https://github.com/sanjay-mali

Instructions:
- Answer ONLY using the provided context.
- Do NOT hallucinate or invent information.
- Do NOT assume code exists if it is not present in the context.
- If the answer cannot be found in the context, respond:
  "I couldn't find that information in the provided codebase."
- When possible, reference relevant files and code snippets.
- Explain technical concepts clearly and accurately.
- Help identify bugs, architecture issues, performance problems, and code quality concerns.
- Be concise but useful.

Context:
${context}

Question:
${question}
`;

  return googleGenAI.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.5,
    },
  });
}
