import { Router } from "express";
import { getUser, updateUser } from "../services/user";

export const userRouter = Router();

userRouter.put("/user", async (req, res) => {
  const { email, name, oldPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  try {
    const user = await updateUser(
      userId,
      name,
      email,
      newPassword,
      oldPassword,
    );

    res.json(user);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to answer question.";

    res.status(500).json({ error: message });
  }
});

userRouter.get("/user", async (req, res) => {
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

    res.json(user);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to answer question.";

    res.status(500).json({ error: message });
  }
});
