import { StateGraph, Annotation } from "@langchain/langgraph";
import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import {
  SystemMessage,
  AIMessage,
  HumanMessage,
} from "@langchain/core/messages";
import { prisma, qdrant } from "../clients";
import { env } from "../config/env";
import { parseFilesToText, type FileData } from "./fileParser";
import { system_prompt } from "./system_prompt";
import { createConversation, getConversation } from "../services/conversation";
import { createMessage, getMessages } from "../services/message";

export enum BaseModel {
  OPENAI = "openai",
  GEMINI = "gemini",
}

export const GraphState = Annotation.Root({
  question: Annotation<string>(),
  userId: Annotation<string>(),
  conversationId: Annotation<string>(),
  baseModel: Annotation<BaseModel>(),
  modelName: Annotation<string>(),
  apiKeys: Annotation<Record<string, string>>(),
  files: Annotation<FileData[]>(),
  context: Annotation<string>(),
  history: Annotation<any[]>(),
  response: Annotation<string>(),
  title: Annotation<string>(),
});

function getEmbeddings(baseModel: BaseModel, apiKeys: Record<string, string>) {
  if (baseModel === BaseModel.GEMINI) {
    if (!apiKeys.gemini) {
      throw new Error("Gemini API key is required for document embeddings.");
    }
    return new GoogleGenerativeAIEmbeddings({
      modelName: "gemini-embedding-2",
      apiKey: apiKeys.gemini,
    });
  }

  if (!apiKeys.openai) {
    throw new Error("OpenAI API key is required for document embeddings.");
  }
  return new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
    openAIApiKey: apiKeys.openai,
    dimensions: 1536,
  });
}

function getChatModel(
  baseModel: BaseModel,
  modelName: string,
  apiKeys: Record<string, string>,
) {
  switch (baseModel) {
    case BaseModel.OPENAI:
      if (!apiKeys.openai) {
        throw new Error("OpenAI API key is required but not provided.");
      }
      return new ChatOpenAI({
        model: modelName,
        openAIApiKey: apiKeys.openai,
        streaming: true,
        temperature: 0.3,
      });
    case BaseModel.GEMINI:
      if (!apiKeys.gemini) {
        throw new Error("Gemini API key is required but not provided.");
      }
      return new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: apiKeys.gemini,
        streaming: true,
        temperature: 0.3,
      });

    default:
      throw new Error(`Unsupported provider: ${baseModel}`);
  }
}

async function initializeNode(state: typeof GraphState.State) {
  let conversationId = state.conversationId;
  const userId = state.userId;

  if (conversationId) {
    const conversation = await getConversation(conversationId, userId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized.");
    }
  } else {
    const conversation = await createConversation(userId);
    conversationId = conversation.id;
  }

  const previousMessages = await getMessages(conversationId);

  await createMessage(conversationId, "user", state.question);

  return {
    conversationId,
    history: previousMessages,
  };
}

async function ingestNode(state: typeof GraphState.State) {
  if (!state.files || state.files.length === 0) {
    return {};
  }

  const fileText = await parseFilesToText(state.files);
  if (!fileText) {
    return {};
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const chunks = await splitter.splitText(fileText);

  const embeddings = getEmbeddings(state.baseModel, state.apiKeys);
  const vectorStore = new QdrantVectorStore(embeddings, {
    client: qdrant,
    collectionName: env.qdrantCollection,
  });

  const docs = chunks.map(
    (chunk) =>
      new Document({
        pageContent: chunk,
        metadata: { conversation_id: state.conversationId },
      }),
  );

  await vectorStore.addDocuments(docs);
  return {};
}

async function retrieveNode(state: typeof GraphState.State) {
  try {
    const embeddings = getEmbeddings(state.baseModel, state.apiKeys);
    const vectorStore = new QdrantVectorStore(embeddings, {
      client: qdrant,
      collectionName: env.qdrantCollection,
    });

    const results = await vectorStore.similaritySearch(state.question, 5, {
      must: [
        {
          key: "metadata.conversation_id",
          match: {
            value: state.conversationId,
          },
        },
      ],
    });

    if (!results || results.length === 0) {
      return { context: "" };
    }

    const context = results
      .map((r) => r.pageContent)
      .filter(Boolean)
      .join("\n\n---\n\n");

    return { context };
  } catch (err) {
    console.error("Error retrieving context from Qdrant:", err);
    return { context: "" };
  }
}

async function generateTitleNode(state: typeof GraphState.State) {
  if (state.history.length > 0) {
    return {};
  }

  const prompt = `
Generate a concise chat title for this first user message.

Rules:
- Return only the title.
- Use 3 to 6 words.
- Do not use quotes.
- Do not add explanation.

Message:
${state.question}
`;

  try {
    const chatModel = getChatModel(
      state.baseModel,
      state.modelName,
      state.apiKeys,
    );
    const res = await chatModel.invoke(prompt);
    let title = (typeof res.content === "string" ? res.content : "")
      .replace(/^["']|["']$/g, "")
      .trim();

    const TITLE_MAX_LENGTH = 60;
    if (!title) {
      title =
        state.question.length > TITLE_MAX_LENGTH
          ? `${state.question.slice(0, TITLE_MAX_LENGTH).trim()}...`
          : state.question;
    }

    await prisma.conversation.update({
      where: { id: state.conversationId },
      data: { title },
    });

    return { title };
  } catch (err) {
    console.error("Title generation failed:", err);
    return {};
  }
}

async function generateNode(
  state: typeof GraphState.State,
  config?: RunnableConfig,
) {
  const onToken = config?.configurable?.onToken;

  const messages: (SystemMessage | AIMessage | HumanMessage)[] = [];
  messages.push(new SystemMessage(system_prompt));

  const slicedHistory = state.history.slice(-7);
  for (const msg of slicedHistory) {
    if (msg.role === "user") {
      messages.push(new HumanMessage(msg.content));
    } else if (msg.role === "assistant") {
      messages.push(new AIMessage(msg.content));
    }
  }

  let finalUserMessage = state.question;
  if (state.context) {
    finalUserMessage = `Use the following context to answer the question. Do not use outside knowledge if the answer is in the context.\n\nContext:\n${state.context}\n\nQuestion: ${state.question}`;
  }
  messages.push(new HumanMessage(finalUserMessage));

  const chatModel = getChatModel(
    state.baseModel,
    state.modelName,
    state.apiKeys,
  );

  let responseText = "";
  try {
    const stream = await chatModel.stream(messages);
    for await (const chunk of stream) {
      const text = typeof chunk.content === "string" ? chunk.content : "";
      if (text) {
        responseText += text;
        if (onToken) {
          onToken(text);
        }
      }
    }
  } catch (err) {
    console.error("Error during streaming generation:", err);
    const errorMsg = "\n\nSorry, something went wrong.";
    responseText += errorMsg;
    if (onToken) {
      onToken(errorMsg);
    }
  }

  const savedResponse = responseText.trim() || "[No response from provider]";
  await createMessage(state.conversationId, "assistant", savedResponse);

  return { response: savedResponse };
}

const workflow = new StateGraph(GraphState)
  .addNode("initialize", initializeNode)
  .addNode("ingest", ingestNode)
  .addNode("retrieve", retrieveNode)
  .addNode("generateTitle", generateTitleNode)
  .addNode("generate", generateNode)
  .addEdge("__start__", "initialize")
  .addEdge("initialize", "ingest")
  .addEdge("ingest", "retrieve")
  .addEdge("retrieve", "generateTitle")
  .addEdge("generateTitle", "generate")
  .addEdge("generate", "__end__");

export const graph = workflow.compile();

export async function runLangGraphFlow(
  inputs: {
    question: string;
    userId: string;
    conversationId?: string;
    baseModel: BaseModel;
    modelName: string;
    apiKeys: Record<string, string>;
    files: FileData[];
  },
  onToken: (token: string) => void,
) {
  const result = await graph.invoke(inputs, {
    configurable: {
      onToken,
    },
  });

  return result.conversationId;
}
