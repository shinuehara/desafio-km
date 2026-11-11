"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { getByToken } from "@/lib/queries";
import { parseKmToMeters } from "@/lib/format";
import { todayISO } from "@/lib/dates";
import { extensionFor, newKey, putFile } from "@/lib/storage";
import { MAX_KM_PER_ACTIVITY, MAX_PHOTO_BYTES } from "@/lib/constants";

export type RegisterState = { error?: string };

export async function registerActivity(token: string, _prev: RegisterState, form: FormData): Promise<RegisterState> {
  const ctx = await getByToken(token);
  if (!ctx) return { error: "Link não encontrado." };
  const { participant: p, challenge: c } = ctx;

  const meters = parseKmToMeters(String(form.get("km") ?? ""));
  if (!meters) return { error: "Escreva quantos km você fez. Exemplo: 5 ou 5,2" };
  if (meters > MAX_KM_PER_ACTIVITY * 1000) {
    return { error: `${(meters / 1000).toLocaleString("pt-BR")} km de uma vez? Confira o número (use vírgula: 5,2).` };
  }

  const today = todayISO();
  const date = String(form.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Escolha o dia da atividade." };
  if (date > today) return { error: "A data não pode ser no futuro." };
  if (date < c.startDate) return { error: "Essa data é antes do começo do desafio." };
  if (date > c.endDate) return { error: "Essa data é depois do fim do desafio." };

  const photo = form.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Falta a foto: pode ser o print do app, do relógio ou a foto da esteira." };
  }
  if (photo.size > MAX_PHOTO_BYTES) return { error: "A foto é grande demais. Tente um print da tela." };
  const type = photo.type || "image/jpeg";
  if (!type.startsWith("image/") || !extensionFor(type)) return { error: "Envie uma foto (JPG ou PNG)." };

  const key = newKey(`c${c.id}/p${p.id}`, type);
  try {
    await putFile("fotos", key, Buffer.from(await photo.arrayBuffer()), type);
  } catch (e) {
    console.error("Falha ao guardar foto", e);
    return { error: "Não conseguimos guardar a foto agora. Tente de novo daqui a pouco." };
  }

  const [row] = await db
    .insert(activities)
    .values({ participantId: p.id, distanceM: meters, activityDate: date, photoKey: key })
    .returning({ id: activities.id });

  redirect(`/p/${token}/feito/${row.id}`);
}
