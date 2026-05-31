import { Router } from "express";
import { env } from "../config/env";
import { askQuestion } from "../services/answer";

export const askRouter = Router();

askRouter.post("/", async (req, res) => {
  const question = typeof req.body?.q === "string" ? req.body.q.trim() : "";

  if (!question) {
    res.status(400).json({ error: "Question is required." });
    return;
  }

  if (question.length > env.maxQuestionLength) {
    res.status(400).json({
      error: `Question exceeds the maximum allowed length of ${env.maxQuestionLength} characters.`,
    });
    return;
  }

  try {
    const response = await askQuestion(question);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of response) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }

    res.end();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to answer question.";

    if (res.headersSent) {
      res.write(`\n\n${message}`);
      res.end();
      return;
    }

    res.status(500).json({ error: message });
  }
});
