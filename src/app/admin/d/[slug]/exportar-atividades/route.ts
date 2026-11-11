import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activities, participants, teams } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { getChallenge } from "@/lib/queries";
import { formatKm } from "@/lib/format";
import { csvResponse } from "@/lib/csv";

/** Todas as atividades do desafio (cópia de segurança e conferência). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) return new Response("Não autorizado", { status: 401 });
  const { slug } = await params;
  const c = await getChallenge(slug);
  if (!c) return new Response("Não encontrado", { status: 404 });

  const rows = await db
    .select({ a: activities, name: participants.name, teamName: teams.name })
    .from(activities)
    .innerJoin(participants, eq(participants.id, activities.participantId))
    .leftJoin(teams, eq(teams.id, participants.teamId))
    .where(eq(participants.challengeId, c.id))
    .orderBy(asc(activities.activityDate), asc(participants.name));

  const header = ["Dia", "Participante", "Turma", "Km", "Situação", "Enviada em", "Foto", "Lançado pelo organizador"];
  const lines = rows.map(({ a, name, teamName }) => [
    a.activityDate.split("-").reverse().join("/"),
    name,
    teamName ?? "",
    formatKm(a.distanceM),
    a.invalidatedAt ? "invalidada" : "válida",
    a.createdAt.toISOString().replace("T", " ").slice(0, 16),
    a.photoKey ? "sim" : a.adminNote ? "" : "apagada",
    a.adminNote ?? "",
  ]);
  return csvResponse([header, ...lines], `atividades-${c.slug}.csv`);
}
