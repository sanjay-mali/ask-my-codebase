import { Router } from "express";
import {
  deleteConversation,
  getConversation,
  getUserConversations,
  updateConversationTitle,
} from "../services/conversation";
import { getMessages } from "../services/message";

export const conversationRouter = Router();

conversationRouter.get("/all", async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  try {
    const conversations = await getUserConversations(userId);
    const sanitizedConversations = conversations.map((c) => ({
      ...c,
      title: c.title?.trim() || "Untitled Chat",
    }));

    res.json({ conversations: sanitizedConversations });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load conversations.";

    res.status(500).json({ error: message });
  }
});

conversationRouter.get("/:conversationId", async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  try {
    const conversationId = req.params.conversationId;
    const conversation = await getConversation(conversationId, userId);

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }

    const sanitizedConversation = {
      ...conversation,
      title: conversation.title?.trim() || "Untitled Chat",
    };

    res.json({ conversation: sanitizedConversation });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load conversation.";

    res.status(400).json({ error: message });
  }
});

conversationRouter.patch("/:conversationId", async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  try {
    const conversationId = req.params.conversationId;
    const title = req.body?.title;
    const conversation = await getConversation(conversationId, userId);

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }

    const updatedConversation = await updateConversationTitle(
      conversationId,
      title,
      userId,
    );

    const sanitizedConversation = {
      ...updatedConversation,
      title: updatedConversation.title?.trim() || "Untitled Chat",
    };

    res.json({ conversation: sanitizedConversation });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update conversation.";

    res.status(400).json({ error: message });
  }
});

conversationRouter.delete("/:conversationId", async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  try {
    const conversationId = req.params.conversationId;
    const conversation = await getConversation(conversationId, userId);

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }

    await deleteConversation(conversationId);
    res.status(204).end();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete conversation.";

    res.status(400).json({ error: message });
  }
});

conversationRouter.get("/:conversationId/messages", async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  try {
    const conversationId = req.params.conversationId;
    const conversation = await getConversation(conversationId, userId);

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }

    const messages = await getMessages(conversationId);
    res.json({ messages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load messages.";

    res.status(400).json({ error: message });
  }
});
