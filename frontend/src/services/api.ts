type AskCodebaseOptions = {
  question: string;
  onChunk: (answer: string) => void;
};

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

export async function askCodebase({ question, onChunk }: AskCodebaseOptions) {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: question }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
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
