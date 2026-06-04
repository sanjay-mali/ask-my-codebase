import { prisma } from "../../clients";
import Bun from "bun";

export async function createUser(
  name: string,
  email: string,
  password: string,
) {
  const hashedPassword = await Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 3,
  });

  const user = prisma.user.create({
    data: {
      email: email,
      name: name,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  return user;
}

export function getUser(userId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}
export async function updateUser(
  userId: string,
  name: string,
  email: string,
  newPassword: string,
  oldPassword: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await Bun.password.verify(oldPassword, user.password);

  if (!isMatch) {
    throw new Error("Invalid current password");
  }

  const hashedPassword = await Bun.password.hash(newPassword, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 3,
  });

  return prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}
