import { googleGenAI, prisma } from "../clients";
import { createMessage, getMessages } from "./message";
import { retrieveContext } from "./retrieve";

const TITLE_MAX_LENGTH = 60;

function fallbackTitle(question: string) {
  return question.length > TITLE_MAX_LENGTH
    ? `${question.slice(0, TITLE_MAX_LENGTH).trim()}...`
    : question;
}

async function generateConversationTitle(question: string) {
  try {
    const response = await googleGenAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Generate a concise chat title for this first user message.

Rules:
- Return only the title.
- Use 3 to 6 words.
- Do not use quotes.
- Do not add explanation.

Message:
${question}
`,
      config: {
        temperature: 0.2,
        maxOutputTokens: 190,
      },
    });

    let title = response.text?.trim() ?? "";
    title = title.replace(/^["']|["']$/g, "").trim();
    return title || fallbackTitle(question);
  } catch {
    return fallbackTitle(question);
  }
}

export async function askQuestion(conversationId: string, question: string) {
  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) {
    throw new Error("Question is required.");
  }

  const previousMessages = await getMessages(conversationId);

  if (previousMessages.length === 0) {
    let title = await generateConversationTitle(trimmedQuestion);
    title = title.trim();
    if (!title) {
      title = fallbackTitle(trimmedQuestion);
    }

    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        title,
      },
    });
  }

  await createMessage(conversationId, "user", trimmedQuestion);

  const relevantChunks = await retrieveContext(trimmedQuestion);

  const context = relevantChunks
    .map(
      (chunk, index) => `
SOURCE ${index + 1}
FILE: ${chunk.payload?.source ?? "Unknown"}

${chunk.payload?.content ?? ""}
`,
    )
    .join("\n\n====================\n\n");

  const history = previousMessages
    .slice(-10)
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join("\n\n");

  const prompt = `
SYSTEM

You are Ask Your Codebase.

You are an expert software engineering assistant designed to help developers understand, debug, review, and navigate codebases.

About:
- Name: Ask Your Codebase
- Built by Sanjay Mali
- GitHub: https://github.com/sanjay-mali

RULES

1. Answer ONLY using the provided codebase context.
2. Never invent files, functions, APIs, classes, or implementations.
3. If the answer is not present in the context, respond exactly:

"I couldn't find that information in the provided codebase."

4. Always mention relevant files when possible.
5. When debugging:
   - identify root causes
   - explain the issue
   - suggest fixes

6. When reviewing:
   - identify bugs
   - identify security concerns
   - identify performance issues
   - identify maintainability issues

7. Use code snippets from the context when helpful.
8. Be concise but useful.
9. Prefer factual answers over assumptions.

CONVERSATION HISTORY

${history}

CODEBASE CONTEXT

${context}

USER QUESTION

${trimmedQuestion}
`;

  const stream = await googleGenAI.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.3,
      topP: 0.9,
    },
  });

  let fullResponse = "";

  async function* responseGenerator(): AsyncGenerator<string> {
    for await (const chunk of stream) {
      const text = chunk.text ?? "";

      if (!text) continue;
      fullResponse += text;

      yield text;
    }

    if (fullResponse.trim()) {
      await createMessage(conversationId, "assistant", fullResponse);
    }
  }

  return responseGenerator();
}
