const DEFAULT_PORT = 8080;
const DEFAULT_COLLECTION = "codebase";
const DEFAULT_RETRIEVAL_LIMIT = 5;
const DEFAULT_SCORE_THRESHOLD = 0.35;
const DEFAULT_MAX_QUESTION_LENGTH = 1000;

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readNumberEnv(name: string, fallback: number) {
  const raw = process.env[name]?.trim();

  if (!raw) return fallback;

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a number.`);
  }

  return value;
}

export const env = {
  port: readNumberEnv("PORT", DEFAULT_PORT),
  googleApiKey: readRequiredEnv("GOOGLE_API_KEY"),
  qdrantUrl: readRequiredEnv("QDRANT_URL"),
  qdrantCollection: process.env.QDRANT_COLLECTION?.trim() || DEFAULT_COLLECTION,
  corsOrigin: process.env.CORS_ORIGIN?.trim() || "*",
  retrievalLimit: readNumberEnv("RETRIEVAL_LIMIT", DEFAULT_RETRIEVAL_LIMIT),
  scoreThreshold: readNumberEnv("SCORE_THRESHOLD", DEFAULT_SCORE_THRESHOLD),
  maxQuestionLength: readNumberEnv(
    "MAX_QUESTION_LENGTH",
    DEFAULT_MAX_QUESTION_LENGTH,
  ),
};
