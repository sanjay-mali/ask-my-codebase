# Ask Your Codebase Backend

Backend API for indexing code into Qdrant and answering questions with Gemini.

## About project.

This is a RAG (Retrieval-Augmented Generation) pipeline that indexes your codebase, generates embeddings, and stores them in Qdrant. When a user submits a query, the system retrieves the most relevant code context from the indexed codebase and provides it to Gemini to generate a response.

The assistant is designed to answer questions only from the indexed codebase and does not rely on external knowledge or context. This is the initial and basic version of the system..
