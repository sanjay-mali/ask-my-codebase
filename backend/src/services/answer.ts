import { prisma } from "../clients";
import { BaseModel, generateResponseStream } from "../utils/generateResponse";
import { system_prompt } from "../utils/system_prompt";
import { createMessage, getMessages } from "./message";

const TITLE_MAX_LENGTH = 60;

function fallbackTitle(question: string): string {
  return question.length > TITLE_MAX_LENGTH
    ? `${question.slice(0, TITLE_MAX_LENGTH).trim()}...`
    : question;
}

async function generateConversationTitle(
  question: string,
  baseModel: BaseModel,
  modelName: string,
  apiKeys: Record<string, string>,
): Promise<string> {
  try {
    const prompt = `
Generate a concise chat title for this first user message.

Rules:
- Return only the title.
- Use 3 to 6 words.
- Do not use quotes.
- Do not add explanation.

Message:
${question}
`;

    const stream = await generateResponseStream(
      prompt,
      baseModel,
      modelName,
      apiKeys,
    );
    let title = "";
    for await (const chunk of stream) {
      title += chunk.text;
    }

    title = title.replace(/^["']|["']$/g, "").trim();

    return title || fallbackTitle(question);
  } catch (err) {
    console.error("Title generation failed:", err);
    return fallbackTitle(question);
  }
}

function buildPrompt(
  history: Awaited<ReturnType<typeof getMessages>>,
  question: string,
): string {
  const conversationHistory = history
    .slice(-10)
    .map((message) =>
      `
<${message.role}>
${message.content}
</${message.role}>
`.trim(),
    )
    .join("\n\n");

  return `
<SYSTEM>
${system_prompt}
</SYSTEM>

<CONVERSATION_HISTORY>
${conversationHistory}
</CONVERSATION_HISTORY>

<CURRENT_USER_MESSAGE>
${question}
</CURRENT_USER_MESSAGE>
`.trim();
}

export async function askQuestion(
  conversationId: string,
  question: string,
  baseModel: BaseModel,
  modelName: string,
  apiKeys: Record<string, string> = {},
) {
  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) {
    throw new Error("Question is required.");
  }

  const previousMessages = await getMessages(conversationId);

  if (previousMessages.length === 0) {
    let title = await generateConversationTitle(
      trimmedQuestion,
      baseModel,
      modelName,
      apiKeys,
    );
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

  const prompt = buildPrompt(previousMessages, trimmedQuestion);

  const stream = await generateResponseStream(
    prompt,
    baseModel,
    modelName,
    apiKeys,
  );

  async function* responseGenerator(): AsyncGenerator<string> {
    const chunks: string[] = [];

    const startedAt = Date.now();

    try {
      for await (const chunk of stream) {
        chunks.push(chunk.text);

        yield chunk.text;
      }

      const fullResponse = chunks.join("").trim();

      if (fullResponse) {
        await createMessage(conversationId, "assistant", fullResponse);
      }

      console.info({
        provider: baseModel,
        model: modelName,
        durationMs: Date.now() - startedAt,
        responseLength: fullResponse.length,
      });
    } catch (error) {
      console.error(error);

      yield "\n\nSorry, something went wrong.";
    }
  }

  return responseGenerator();
}
