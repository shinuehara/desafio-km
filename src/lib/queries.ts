import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { activities, challenges, participants, teams } from "@/db/schema";
import type { Challenge, Participant, Team } from "@/db/schema";

export async function getChallenge(slug: string): Promise<Challenge | null> {
  const [c] = await db.select().from(challenges).where(eq(challenges.slug, slug)).limit(1);
  return c ?? null;
}

export async function listChallenges(): Promise<Challenge[]> {
  return db.select().from(challenges).orderBy(desc(challenges.startDate));
}

export async function listTeams(challengeId: number): Promise<Team[]> {
  return db.select().from(teams).where(eq(teams.challengeId, challengeId)).orderBy(asc(teams.name));
}

export type ParticipantContext = {
  participant: Participant;
  challenge: Challenge;
  team: Team | null;
};

export async function getByToken(token: string): Promise<ParticipantContext | null> {
  const rows = await db
    .select({ participant: participants, challenge: challenges, team: teams })
    .from(participants)
    .innerJoin(challenges, eq(challenges.id, participants.challengeId))
    .leftJoin(teams, eq(teams.id, participants.teamId))
    .where(eq(participants.token, token))
    .limit(1);
  return rows[0] ?? null;
}

/** Total em metros de cada participante, contando só atividades válidas. */
const validTotal = sql<number>`coalesce(sum(${activities.distanceM}) filter (where ${activities.invalidatedAt} is null), 0)::int`;
const validCount = sql<number>`(count(${activities.id}) filter (where ${activities.invalidatedAt} is null))::int`;

export async function totalMeters(participantId: number): Promise<number> {
  const [row] = await db
    .select({ total: validTotal })
    .from(activities)
    .where(eq(activities.participantId, participantId));
  return row?.total ?? 0;
}

export type Standing = {
  id: number;
  name: string;
  teamId: number | null;
  teamName: string | null;
  goalKm: number;
  meters: number;
  activities: number;
  token: string;
  whatsapp: string;
  shirtSize: string;
  city: string;
  state: string;
  paidAt: Date | null;
  paidCents: number | null;
  kitSentAt: Date | null;
  createdAt: Date;
};

/** Todos os participantes do desafio com o total de km, do maior para o menor. */
export async function standings(challengeId: number): Promise<Standing[]> {
  return db
    .select({
      id: participants.id,
      name: participants.name,
      teamId: participants.teamId,
      teamName: teams.name,
      goalKm: participants.goalKm,
      meters: validTotal,
      activities: validCount,
      token: participants.token,
      whatsapp: participants.whatsapp,
      shirtSize: participants.shirtSize,
      city: participants.city,
      state: participants.state,
      paidAt: participants.paidAt,
      paidCents: participants.paidCents,
      kitSentAt: participants.kitSentAt,
      createdAt: participants.createdAt,
    })
    .from(participants)
    .leftJoin(teams, eq(teams.id, participants.teamId))
    .leftJoin(activities, eq(activities.participantId, participants.id))
    .where(eq(participants.challengeId, challengeId))
    .groupBy(participants.id, teams.name)
    .orderBy(desc(validTotal), asc(participants.name));
}

export async function participantActivities(participantId: number) {
  return db
    .select()
    .from(activities)
    .where(eq(activities.participantId, participantId))
    .orderBy(desc(activities.activityDate), desc(activities.createdAt));
}

export async function recentActivities(challengeId: number, onlyInvalid: boolean, limit = 60) {
  return db
    .select({
      activity: activities,
      name: participants.name,
      teamName: teams.name,
    })
    .from(activities)
    .innerJoin(participants, eq(participants.id, activities.participantId))
    .leftJoin(teams, eq(teams.id, participants.teamId))
    .where(
      and(
        eq(participants.challengeId, challengeId),
        onlyInvalid ? sql`${activities.invalidatedAt} is not null` : undefined,
      ),
    )
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}

export async function countInvalid(challengeId: number): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(activities)
    .innerJoin(participants, eq(participants.id, activities.participantId))
    .where(and(eq(participants.challengeId, challengeId), sql`${activities.invalidatedAt} is not null`));
  return row?.n ?? 0;
}

