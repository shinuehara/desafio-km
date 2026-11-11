import { notFound } from "next/navigation";
import { cache } from "react";
import { getByToken } from "@/lib/queries";
import { isTokenShape } from "@/lib/token";

/** Carrega o participante pelo link pessoal (uma vez por requisição). */
export const loadParticipant = cache(async (token: string) => {
  if (!isTokenShape(token)) notFound();
  const ctx = await getByToken(token);
  if (!ctx) notFound();
  return ctx;
});
