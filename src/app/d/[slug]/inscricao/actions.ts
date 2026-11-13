"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { participants, teams } from "@/db/schema";
import { getChallenge } from "@/lib/queries";
import { challengePhase } from "@/lib/dates";
import { normalizeWhatsapp, onlyDigits } from "@/lib/format";
import { newToken } from "@/lib/token";
import { SHIRT_SIZES } from "@/lib/constants";



const schema = z.object({
  name: z.string().trim().min(3, "Escreva seu nome completo.").max(80),
  whatsapp: z.string(),
  team: z.string().optional(),
  shirtSize: z.enum(SHIRT_SIZES, { error: "Escolha o tamanho da camiseta." }),
  cep: z.string().transform(onlyDigits).pipe(z.string().length(8, "O CEP tem 8 números.")),
  street: z.string().trim().min(2, "Escreva a rua.").max(120),
  number: z.string().trim().min(1, "Escreva o número da casa ou prédio.").max(20),
  complement: z.string().trim().max(60).default(""),
  neighborhood: z.string().trim().max(60).default(""),
  city: z.string().trim().min(2, "Escreva a cidade.").max(60),
  state: z.string().trim().toUpperCase().length(2, "Escreva a sigla do estado (ex.: SP)."),
  accept: z.literal("on", { error: "Marque que você leu o regulamento e aceita o uso dos dados para o desafio." }),
});

export type SignupState = { error?: string };

export async function signup(slug: string, _prev: SignupState, form: FormData): Promise<SignupState> {
  const c = await getChallenge(slug);
  if (!c) return { error: "Desafio não encontrado." };
  if (!c.registrationOpen || challengePhase(c.startDate, c.endDate) === "after") {
    return { error: "As inscrições estão fechadas." };
  }

  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira os dados." };
  const data = parsed.data;

  const whatsapp = normalizeWhatsapp(data.whatsapp);
  if (!whatsapp) return { error: "Confira o WhatsApp: DDD + número, ex.: (11) 91234-5678." };

  let teamId: number | null = null;
  if (data.team) {
    const [t] = await db
      .select()
      .from(teams)
      .where(and(eq(teams.challengeId, c.id), eq(teams.slug, data.team)))
      .limit(1);
    teamId = t?.id ?? null;
  }

  const [existing] = await db
    .select({ id: participants.id })
    .from(participants)
    .where(and(eq(participants.challengeId, c.id), eq(participants.whatsapp, whatsapp)))
    .limit(1);
  if (existing) {
    return { error: "Este WhatsApp já está inscrito. Volte e toque em “Já me inscrevi” para receber seu link." };
  }

  const token = newToken();
  await db.insert(participants).values({
    challengeId: c.id,
    teamId,
    token,
    name: data.name,
    whatsapp,
    shirtSize: data.shirtSize,
    cep: data.cep,
    street: data.street,
    number: data.number,
    complement: data.complement,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    goalKm: c.goals[0] ?? 42,
    acceptedRulesAt: new Date(),
  });

  redirect(`/p/${token}/pagamento`);
}
