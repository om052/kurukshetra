import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { challengesCollection } from "../services/challenges.js";
import { kingdomsCollection } from "../services/kingdoms.js";
import { membershipsCollection } from "../services/memberships.js";
import { getDb } from "../db.js";

export const challengesRouter = Router();

const createSchema = z.object({
  kingdomId: z.string().min(1),
  defenderId: z.string().min(1),
  type: z.enum(["leadership", "training", "senapati"]),
  exerciseId: z.string().min(1),
  timeLimitMin: z.number().int().positive(),
});

challengesRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid challenge request", details: parsed.error.flatten() });
  const userId = (req as any).auth.userId;
  const { kingdomId, defenderId, type, exerciseId, timeLimitMin } = parsed.data;
  const { ObjectId } = await import("mongodb");
  if (!/^[a-f0-9]{24}$/i.test(kingdomId)) return res.status(400).json({ error: "invalid id" });
  const kcol = await kingdomsCollection();
  const kingdom = await kcol.findOne({ _id: new ObjectId(kingdomId) });
  if (!kingdom) return res.status(404).json({ error: "kingdom not found" });
  const mcol = await membershipsCollection();
  const challengerMem = await mcol.findOne({ kingdomId: new ObjectId(kingdomId), clerkUserId: userId });
  if (!challengerMem) return res.status(403).json({ error: "not a member of this kingdom" });
  if (type === "leadership") {
    if (challengerMem.role !== "Senapati") return res.status(403).json({ error: "only Senapati can challenge the King" });
    const kingMem = await mcol.findOne({ kingdomId: new ObjectId(kingdomId), role: "King" });
    if (!kingMem || kingMem.clerkUserId !== defenderId) return res.status(400).json({ error: "defender must be the King" });
  }
  const ccol = await challengesCollection();
  const now = new Date();
  const doc = {
    kingdomId: new ObjectId(kingdomId),
    challengerId: userId,
    challengerName: undefined,
    defenderId,
    defenderName: undefined,
    type,
    exerciseId,
    timeLimitMin,
    status: "pending" as const,
    rules: "Fair challenge as per established rules.",
    createdAt: now,
    updatedAt: now,
  };
  const result = await ccol.insertOne(doc);
  res.status(201).json({ challenge: { ...doc, _id: result.insertedId } });
});

challengesRouter.get("/kingdom/:kingdomId", async (req, res) => {
  const { ObjectId } = await import("mongodb");
  if (!/^[a-f0-9]{24}$/i.test(req.params.kingdomId)) return res.status(400).json({ error: "invalid id" });
  const ccol = await challengesCollection();
  const docs = await ccol.find({ kingdomId: new ObjectId(req.params.kingdomId) }).toArray();
  res.json({ challenges: docs });
});

const agreeSchema = z.object({
  agreedExercise: z.string().min(1),
  agreedTimeLimitMin: z.number().int().positive(),
});

challengesRouter.post("/:id/agree", requireAuth, async (req, res) => {
  const { ObjectId } = await import("mongodb");
  if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(400).json({ error: "invalid id" });
  const userId = (req as any).auth.userId;
  const parsed = agreeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid agreement" });
  const ccol = await challengesCollection();
  const ch = await ccol.findOne({ _id: new ObjectId(req.params.id) });
  if (!ch) return res.status(404).json({ error: "challenge not found" });
  if (ch.defenderId !== userId && ch.challengerId !== userId) return res.status(403).json({ error: "not a participant" });
  if (ch.status === "resolved") return res.status(409).json({ error: "already resolved" });
  const now = new Date();
  await ccol.updateOne({ _id: ch._id }, { $set: { status: "agreed", agreedExercise: parsed.data.agreedExercise, agreedTimeLimitMin: parsed.data.agreedTimeLimitMin, agreedAt: now, updatedAt: now } });
  const updated = await ccol.findOne({ _id: ch._id });
  res.json({ challenge: updated });
});

challengesRouter.post("/:id/resolve", requireAuth, async (req, res) => {
  const { ObjectId } = await import("mongodb");
  if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(400).json({ error: "invalid id" });
  const userId = (req as any).auth.userId;
  const ccol = await challengesCollection();
  const ch = await ccol.findOne({ _id: new ObjectId(req.params.id) });
  if (!ch) return res.status(404).json({ error: "challenge not found" });
  if (ch.defenderId !== userId && ch.challengerId !== userId) return res.status(403).json({ error: "not a participant" });
  const { result, outcome } = req.body || {};
  const now = new Date();
  const session = (await getDb()).client.startSession();
  try {
    const useTx = (session as any).withTransaction;
    if (useTx) {
      await session.withTransaction(async () => {
        await ccol.updateOne({ _id: ch._id }, { $set: { status: "resolved", result, outcome, updatedAt: now } }, { session });
        if (ch.type === "leadership" && outcome === "challenger_wins") {
          const kcol = await kingdomsCollection();
          const mcol = await membershipsCollection();
          await mcol.updateMany({ kingdomId: ch.kingdomId, role: "King" }, { $set: { role: "Member" } }, { session });
          await mcol.updateOne({ kingdomId: ch.kingdomId, clerkUserId: ch.challengerId }, { $set: { role: "King" } }, { session });
          await kcol.updateOne({ _id: ch.kingdomId }, { $set: { kingClerkUserId: ch.challengerId, updatedAt: now } }, { session });
        }
      });
    } else {
      await ccol.updateOne({ _id: ch._id }, { $set: { status: "resolved", result, outcome, updatedAt: now } });
      if (ch.type === "leadership" && outcome === "challenger_wins") {
        const kcol = await kingdomsCollection();
        const mcol = await membershipsCollection();
        await mcol.updateMany({ kingdomId: ch.kingdomId, role: "King" }, { $set: { role: "Member" } });
        await mcol.updateOne({ kingdomId: ch.kingdomId, clerkUserId: ch.challengerId }, { $set: { role: "King" } });
        await kcol.updateOne({ _id: ch.kingdomId }, { $set: { kingClerkUserId: ch.challengerId, updatedAt: now } });
      }
    }
  } finally {
    await session.endSession();
  }
  const updated = await ccol.findOne({ _id: ch._id });
  res.json({ challenge: updated });
});
