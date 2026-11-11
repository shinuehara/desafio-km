"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { participants } from "@/db/schema";
import { getByToken, totalMeters } from "@/lib/queries";

/** Quem completou a meta atual pode subir para a próxima (ex.: 42 → 100 km). */
export async function acceptNextGoal(token: string) {
  const ctx = await getByToken(token);
  if (!ctx) return;
  const next = ctx.challenge.goals.find((g) => g > ctx.participant.goalKm);
  if (!next) return;
  const total = await totalMeters(ctx.participant.id);
  if (total < ctx.participant.goalKm * 1000) return;
  await db.update(participants).set({ goalKm: next }).where(eq(participants.id, ctx.participant.id));
  revalidatePath(`/p/${token}`);
}

export async function declineNextGoal(token: string) {
  (await cookies()).set(`dkm_meta_${token}`, "nao", { path: `/p/${token}`, maxAge: 60 * 60 * 24 * 120 });
  revalidatePath(`/p/${token}`);
}
