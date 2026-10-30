import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { upsertProfile } from "../services/profiles.js";

export const authRouter = Router();
authRouter.get("/me", requireAuth, async (req, res) => {
  const userId = (req as any).auth.userId;
  const profile = await upsertProfile(userId);
  res.json({ userId, profile });
});