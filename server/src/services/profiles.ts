import { Collection } from "mongodb";
import { getDb } from "../db.js";

export interface UserProfile {
  clerkUserId: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function profilesCollection(): Promise<Collection<UserProfile>> {
  const db = getDb();
  const col = db.collection<UserProfile>("profiles");
  await col.createIndex({ clerkUserId: 1 }, { unique: true });
  return col;
}

export async function upsertProfile(clerkUserId: string, displayName?: string) {
  const col = await profilesCollection();
  const now = new Date();
  await col.updateOne(
    { clerkUserId },
    { $setOnInsert: { clerkUserId, displayName, createdAt: now }, $set: { updatedAt: now, ...(displayName ? { displayName } : {}) } },
    { upsert: true },
  );
  return col.findOne({ clerkUserId });
}