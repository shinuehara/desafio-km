"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { activities, challenges, participants, teams } from "@/db/schema";
import { checkPassword, endAdminSession, requireAdmin, startAdminSession } from "@/lib/auth";
import { normalizeWhatsapp, parseMoneyToCents, slugify } from "@/lib/format";
import { newKey, putFile } from "@/lib/storage";

export type FormState = { error?: string; ok?: string };

// ---------- Login ----------

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  if (!checkPassword(String(form.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 800)); // freia tentativas
    return { error: "Senha incorreta." };
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/entrar");
}

// ---------- Atividades ----------

export async function setActivityInvalid(activityId: number, invalid: boolean, slug: string) {
  await requireAdmin();
  await db
    .update(activities)
    .set({ invalidatedAt: invalid ? new Date() : null })
    .where(eq(activities.id, activityId));
  revalidatePath(`/admin/d/${slug}`);
}

// ---------- Inscritos ----------

export async function setPaid(participantId: number, paid: boolean, slug: string) {
  await requireAdmin();
  const [c] = await db.select({ price: challenges.priceCents }).from(challenges).where(eq(challenges.slug, slug)).limit(1);
  await db
    .update(participants)
    .set(paid ? { paidAt: new Date(), paidCents: c?.price ?? 0 } : { paidAt: null, paidCents: null })
    .where(eq(participants.id, participantId));
  revalidatePath(`/admin/d/${slug}`);
}

export async function setKitSent(participantId: number, sent: boolean, slug: string) {
  await requireAdmin();
  await db.update(participants).set({ kitSentAt: sent ? new Date() : null }).where(eq(participants.id, participantId));
  revalidatePath(`/admin/d/${slug}`);
}

export async function deleteParticipant(participantId: number, slug: string) {
  await requireAdmin();
  await db.delete(participants).where(eq(participants.id, participantId));
  revalidatePath(`/admin/d/${slug}`);
}

// ---------- Desafio ----------

const challengeSchema = z.object({
  name: z.string().trim().min(3, "Dê um nome ao desafio.").max(80),
  description: z.string().trim().max(400).default(""),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início inválida."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de fim inválida."),
  goals: z.string(),
  price: z.string(),
  kitDescription: z.string().trim().min(2).max(80),
  pixKey: z.string().trim().max(77).default(""),
  pixName: z.string().trim().max(25).default(""),
  pixCity: z.string().trim().max(15).default(""),
  organizerName: z.string().trim().max(60).default(""),
  organizerWhatsapp: z.string().default(""),
  registrationOpen: z.string().optional(),
});

function parseChallenge(form: FormData) {
  const parsed = challengeSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira os dados." };
  const d = parsed.data;
  if (d.endDate < d.startDate) return { error: "O fim precisa ser depois do início." };
  const goals = d.goals
    .split(/[^\d]+/)
    .map(Number)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  if (goals.length === 0) return { error: "Informe pelo menos uma meta em km (ex.: 42, 100)." };
  const priceCents = parseMoneyToCents(d.price || "0");
  if (priceCents === null) return { error: "Valor da inscrição inválido. Ex.: 120,00" };
  let organizerWhatsapp = "";
  if (d.organizerWhatsapp.trim()) {
    const n = normalizeWhatsapp(d.organizerWhatsapp);
    if (!n) return { error: "WhatsApp do organizador inválido." };
    organizerWhatsapp = n;
  }
  return {
    values: {
      name: d.name,
      description: d.description,
      startDate: d.startDate,
      endDate: d.endDate,
      goals: [...new Set(goals)],
      priceCents,
      kitDescription: d.kitDescription,
      pixKey: d.pixKey,
      pixName: d.pixName,
      pixCity: d.pixCity,
      organizerName: d.organizerName,
      organizerWhatsapp,
      registrationOpen: d.registrationOpen === "on",
    },
  };
}

export async function createChallenge(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const r = parseChallenge(form);
  if ("error" in r) return { error: r.error };
  let slug = slugify(String(form.get("slug") || r.values.name)) || "desafio";
  const [taken] = await db.select({ id: challenges.id }).from(challenges).where(eq(challenges.slug, slug)).limit(1);
  if (taken) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  await db.insert(challenges).values({ ...r.values, slug });
  redirect(`/admin/d/${slug}?aba=config`);
}

export async function updateChallenge(id: number, slug: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const r = parseChallenge(form);
  if ("error" in r) return { error: r.error };
  await db.update(challenges).set(r.values).where(eq(challenges.id, id));
  revalidatePath(`/admin/d/${slug}`);
  revalidatePath(`/d/${slug}`);
  return { ok: "Alterações salvas." };
}

export async function uploadChallengeFile(id: number, slug: string, kind: "regulation" | "kit", _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Escolha um arquivo." };
  if (file.size > 10 * 1024 * 1024) return { error: "Arquivo grande demais (máx. 10 MB)." };
  if (kind === "regulation" && file.type !== "application/pdf") return { error: "O regulamento precisa ser PDF." };
  if (kind === "kit" && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { error: "Use uma foto JPG, PNG ou WEBP." };
  const key = newKey(`c${id}/${kind}`, file.type);
  await putFile("publico", key, Buffer.from(await file.arrayBuffer()), file.type);
  await db
    .update(challenges)
    .set(kind === "regulation" ? { regulationKey: key, regulationName: file.name } : { kitImageKey: key })
    .where(eq(challenges.id, id));
  revalidatePath(`/admin/d/${slug}`);
  revalidatePath(`/d/${slug}`);
  return { ok: "Arquivo enviado." };
}

// ---------- Turmas ----------

export async function addTeam(challengeId: number, slug: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Dê um nome à turma." };
  const teamSlug = slugify(name) || "turma";
  const [taken] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.challengeId, challengeId), eq(teams.slug, teamSlug)))
    .limit(1);
  if (taken) return { error: "Já existe uma turma com esse nome." };
  await db.insert(teams).values({ challengeId, name, slug: teamSlug });
  revalidatePath(`/admin/d/${slug}`);
  return { ok: `Turma “${name}” criada.` };
}

export async function removeTeam(teamId: number, slug: string) {
  await requireAdmin();
  // Participantes da turma continuam no desafio, só ficam sem turma.
  await db.delete(teams).where(eq(teams.id, teamId));
  revalidatePath(`/admin/d/${slug}`);
}

