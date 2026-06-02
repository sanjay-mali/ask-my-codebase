import { prisma } from "../../clients";

export async function createConversation(userId: string, title?: string) {
  return prisma.conversation.create({
    data: {
      userId,
      title,
    },
  });
}

export async function getConversation(conversationId: string, userId: string) {
  return prisma.conversation.findUnique({
    where: {
      id: conversationId,
      user: {
        id: userId,
      },
    },
    include: {
      messages: {
        orderBy: {
          createAt: "asc",
        },
      },
    },
  });
}

export async function getUserConversations(userId: string) {
  return prisma.conversation.findMany({
    where: {
      userId,
    },
    orderBy: {
      createAt: "desc",
    },
  });
}

export async function updateConversationTitle(
  conversationId: string,
  title: string,
  userId: string,
) {
  return prisma.conversation.update({
    where: {
      id: conversationId,
      user: {
        id: userId,
      },
    },
    data: {
      title,
    },
  });
}

export async function deleteConversation(conversationId: string) {
  return prisma.conversation.delete({
    where: {
      id: conversationId,
    },
  });
}
