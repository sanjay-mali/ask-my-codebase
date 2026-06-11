export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  name: string;
};

type AuthResponse = {
  user: AuthUser;
};

export type DbMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createAt: string;
};

export type ConversationItem = {
  id: string;
  title: string | null;
  userId: string;
  createAt: string;
};

type AskFinanceAIOptions = {
  question: string;
  conversationId?: string;
  baseModel?: string;
  modelName?: string;
  apiKeys?: any;
  onChunk: (answer: string) => void;
  onConversationId?: (conversationId: string) => void;
  signal?: AbortSignal;
};

const runtimeProcess = typeof process === "undefined" ? undefined : process;
const API_BASE_URL =
  runtimeProcess?.env?.BACKEND_URL || "http://localhost:8080";

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await response.json()) as { error?: string };
    return body.error || `Request failed: ${response.status}`;
  }

  const body = await response.text();
  return body || `Request failed: ${response.status}`;
}

async function requestJson<T>(
  path: string,
  options: Omit<RequestInit, "credentials"> = {},
) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as T;
}

export async function loginUser(input: LoginInput) {
  const response = await requestJson<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.user;
}

export async function registerUser(input: RegisterInput) {
  const response = await requestJson<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.user;
}

export async function getCurrentUser() {
  try {
    const response = await requestJson<AuthResponse>("/auth/me");
    return response.user;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return null;
    }

    throw error;
  }
}

export async function logoutUser() {
  await requestJson<{ message: string }>("/auth/logout", {
    method: "POST",
  });
}

export async function getConversations() {
  const response = await requestJson<{ conversations: ConversationItem[] }>(
    "/conversation/all",
  );
  return response.conversations;
}

export async function getConversationMessages(conversationId: string) {
  const response = await requestJson<{ messages: DbMessage[] }>(
    `/conversation/${conversationId}/messages`,
  );
  return response.messages;
}

export async function deleteConversation(conversationId: string) {
  await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
    method: "DELETE",
    credentials: "include",
  });
}

export async function updateConversationTitle(
  conversationId: string,
  title: string,
) {
  const response = await requestJson<{ conversation: ConversationItem }>(
    `/conversation/${conversationId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ title }),
    },
  );
  return response.conversation;
}

export async function askFinanceAI({
  question,
  conversationId,
  baseModel,
  modelName,
  apiKeys,
  onChunk,
  onConversationId,
  signal,
}: AskFinanceAIOptions) {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: question,
      conversationId,
      baseModel,
      modelName,
      apiKeys,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const responseConversationId = response.headers.get("X-Conversation-Id");
  if (responseConversationId && onConversationId) {
    onConversationId(responseConversationId);
  }

  if (!response.body) {
    throw new Error("No response body received.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullAnswer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    const chunk = decoder.decode(value, {
      stream: true,
    });

    fullAnswer += chunk;
    onChunk(fullAnswer);
  }
}
