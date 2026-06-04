import { Router } from "express";
import { createUser, getUser } from "../services/user";
import { login } from "../services/auth";
import { generateToken } from "../utils/auth";
import { Authorize } from "../middleware/authorize";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { email, name, password } = req.body;

  try {
    const user = await createUser(name, email, password);

    res.status(201).json(user);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create user.";

    res.status(500).json({ error: message });
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await login(email, password);

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const token = generateToken(user.id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to log in.";

    res.status(500).json({ error: message });
  }
});

authRouter.get("/me", Authorize, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  try {
    const user = await getUser(userId);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({ user });
  } catch {
    res.status(500).json({ error: "Unable to load current user." });
  }
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({
    message: "Logout successful",
  });
});
