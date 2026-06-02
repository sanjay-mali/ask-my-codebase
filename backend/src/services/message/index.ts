import { prisma } from "../../clients";

export async function createMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
) {
  return prisma.message.create({
    data: {
      conversationId,
      role,
      content,
    },
  });
}

export async function getMessages(conversationId: string) {
  return prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createAt: "asc",
    },
  });
}
