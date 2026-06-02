import { prisma } from "../../clients";

export async function login(email: string, password: string) {
  if (!email) {
    throw new Error("Email is required");
  }

  if (!password) {
    throw new Error("Password is required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address");
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await Bun.password.verify(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  return user;
}
