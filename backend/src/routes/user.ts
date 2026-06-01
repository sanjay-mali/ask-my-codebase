import { Router } from "express";
import { createUser, getUser, updateUser } from "../services/user";

export const userRouter = Router();

userRouter.post("/user", async (req, res) => {
  const { email, name, password } = req.body;

  try {
    return await createUser(name, email, password);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to answer question.";

    res.status(500).json({ error: message });
  }
});

userRouter.put("/user", async (req, res) => {
  const { userId, email, name, oldPassword, newPassword } = req.body;

  try {
    return await updateUser(userId, name, email, newPassword, oldPassword);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to answer question.";

    res.status(500).json({ error: message });
  }
});

userRouter.get("/user", async (req, res) => {
  const { userId } = req.query;

  try {
    return await getUser(userId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to answer question.";

    res.status(500).json({ error: message });
  }
});
