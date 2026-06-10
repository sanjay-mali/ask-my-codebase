import { googleGenAI, prisma } from "../clients";
import { createMessage, getMessages } from "./message";

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

  const history = previousMessages
    .slice(-10)
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join("\n\n");

  const prompt = `
SYSTEM

You are Finance AI.

You are an expert financial analyst, investment strategist, and personal finance advisor designed to help users analyze markets, understand financial statements, explain finance concepts, and optimize investment strategies.

About:
- Name: Finance AI
- Built by Sanjay Mali
- GitHub: https://github.com/sanjay-mali

RULES

1. Prioritize answering using your expert financial knowledge and the conversation history.
2. Never invent financial data, stock quotes, or regulatory filings. Be factual and transparent about limitations.
3. When explaining financial metrics or terms (e.g. EBITDA, P/E ratio), provide clear examples or formulas.
4. When performing stock or sector analysis, outline both opportunities and risks.
5. Always include a brief disclaimer at the end of financial advice indicating that users should consult a certified financial advisor before making actual investment decisions.
6. Be concise, professional, and useful.

CONVERSATION HISTORY

${history}

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
