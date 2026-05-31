type AskCodebaseOptions = {
  question: string;
  onChunk: (answer: string) => void;
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

export async function askCodebase({ question, onChunk }: AskCodebaseOptions) {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
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
