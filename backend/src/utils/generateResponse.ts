import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export enum BaseModel {
  OPENAI = "openai",
  GEMINI = "gemini",
  ANTHROPIC = "anthropic",
}

export interface AIStreamChunk {
  text: string;
}

export async function generateResponseStream(
  prompt: string,
  provider: BaseModel,
  modelName: string,
  apiKeys: Record<string, string> = {},
): Promise<AsyncGenerator<AIStreamChunk>> {
  switch (provider) {
    case BaseModel.OPENAI: {
      if (!apiKeys.openai) {
        throw new Error("OpenAI API key is required but not provided.");
      }
      const client = new OpenAI({ apiKey: apiKeys.openai });
      const stream = await client.responses.stream({
        model: modelName,
        input: prompt,
      });

      return (async function* () {
        try {
          for await (const event of stream) {
            if (event.type === "response.output_text.delta") {
              yield {
                text: event.delta,
              };
            }
          }
        } finally {
          await stream.done();
        }
      })();
    }

    case BaseModel.GEMINI: {
      if (!apiKeys.gemini) {
        throw new Error("Gemini API key is required but not provided.");
      }
      const client = new GoogleGenAI({ apiKey: apiKeys.gemini });
      const stream = await client.models.generateContentStream({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.3,
          topP: 0.9,
        },
      });

      return (async function* () {
        for await (const chunk of stream) {
          const text = chunk.text ?? "";

          if (!text) continue;

          yield { text };
        }
      })();
    }

    case BaseModel.ANTHROPIC: {
      if (!apiKeys.anthropic) {
        throw new Error("Anthropic API key is required but not provided.");
      }
      const client = new Anthropic({ apiKey: apiKeys.anthropic });
      const stream = await client.messages.stream({
        model: modelName,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      return (async function* () {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            yield {
              text: event.delta.text,
            };
          }
        }
      })();
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
