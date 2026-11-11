import { and, eq, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { activities, challenges, participants } from "@/db/schema";
import { addDaysISO, todayISO } from "./dates";
import { deleteFiles } from "./storage";
import { PHOTO_RETENTION_DAYS } from "./constants";

/** Dia a partir do qual as fotos de um desafio podem ser apagadas automaticamente. */
export function photosExpireOn(endDate: string): string {
  return addDaysISO(endDate, PHOTO_RETENTION_DAYS + 1);
}

/**
 * Apaga as fotos das atividades de um desafio. Os km registrados continuam valendo;
 * só a imagem some (o painel mostra "foto apagada").
 */
export async function purgeChallengePhotos(challengeId: number): Promise<number> {
  const rows = await db
    .select({ id: activities.id, key: activities.photoKey })
    .from(activities)
    .innerJoin(participants, eq(participants.id, activities.participantId))
    .where(and(eq(participants.challengeId, challengeId), isNotNull(activities.photoKey)));

  const keys = rows.map((r) => r.key!).filter(Boolean);
  await deleteFiles("fotos", keys);
  if (rows.length) {
    await db.update(activities).set({ photoKey: null }).where(inArray(activities.id, rows.map((r) => r.id)));
  }
  await db.update(challenges).set({ photosDeletedAt: new Date() }).where(eq(challenges.id, challengeId));
  return keys.length;
}

/** Roda uma vez por dia: apaga as fotos dos desafios que acabaram há mais de PHOTO_RETENTION_DAYS dias. */
export async function purgeExpiredPhotos(today = todayISO()) {
  const cutoff = addDaysISO(today, -PHOTO_RETENTION_DAYS);
  const due = await db
    .select({ id: challenges.id, slug: challenges.slug })
    .from(challenges)
    .where(and(isNull(challenges.photosDeletedAt), lt(challenges.endDate, cutoff)));
  const result: { slug: string; deleted: number }[] = [];
  for (const c of due) result.push({ slug: c.slug, deleted: await purgeChallengePhotos(c.id) });
  return result;
}
