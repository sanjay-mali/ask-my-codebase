# Ask Your Codebase

Backend API for indexing code into Qdrant and answering questions with Gemini.

## About project.

This is a RAG (Retrieval-Augmented Generation) pipeline that indexes your codebase, generates embeddings, and stores them in Qdrant. When a user submits a query, the system retrieves the most relevant code context from the indexed codebase and provides it to Gemini to generate a response.

The assistant is designed to answer questions only from the indexed codebase and does not rely on external knowledge or context. This is the initial and basic version of the system..

## Install

```bash
bun install
```

## Run

```bash
bun run dev
```

## Environment

Required:

```env
GOOGLE_API_KEY=your_google_api_key
QDRANT_URL=http://localhost:6333
```

Optional:

```env
PORT=8080
QDRANT_COLLECTION=codebase
CORS_ORIGIN=*
RETRIEVAL_LIMIT=5
SCORE_THRESHOLD=0.35
MAX_QUESTION_LENGTH=1000
```

## Ingest

```bash
bun run ingest ../02-basic-rag-pipeline
```
