import { Router } from "express";
import { env } from "../config/env";
import { askQuestion } from "../services/answer";
import { createConversation, getConversation } from "../services/conversation";

export const askRouter = Router();

askRouter.post("/", async (req, res) => {
  const question = typeof req.body?.q === "string" ? req.body.q.trim() : "";
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

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

  let conversationId: string | undefined;

  try {
    conversationId = req.body?.conversationId;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid conversationId.";

    res.status(400).json({ error: message });
    return;
  }

  try {
    if (conversationId) {
      const conversation = await getConversation(conversationId, userId);

      if (!conversation || conversation.userId !== userId) {
        res.status(404).json({ error: "Conversation not found." });
        return;
      }
    } else {
      const conversation = await createConversation(userId);
      conversationId = conversation.id;
    }

    const response = await askQuestion(conversationId, question);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Conversation-Id", conversationId);
    res.setHeader("Access-Control-Expose-Headers", "X-Conversation-Id");

    for await (const chunk of response) {
      res.write(chunk);
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
