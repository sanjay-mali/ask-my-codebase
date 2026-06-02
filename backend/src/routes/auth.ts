import { Router } from "express";
import { createUser } from "../services/user";
import { login } from "../services/auth";
import { generateToken } from "../utils/auth";

export const authRouter = Router();

authRouter.post("/create", async (req, res) => {
  const { email, name, password } = req.body;

  try {
    return await createUser(name, email, password);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to answer question.";

    res.status(500).json({ error: message });
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const data = await login(email, password);

    if (!data) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const token = generateToken(data.id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ message: "Login succefully" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to answer question.";

    res.status(500).json({ error: message });
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
