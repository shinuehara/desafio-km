import { timingSafeEqual } from "node:crypto";
import { purgeExpiredPhotos } from "@/lib/cleanup";

/**
 * Limpeza diária das fotos antigas. Chamada por um agendador (GitHub Actions, Vercel Cron…)
 * com o cabeçalho "Authorization: Bearer <CRON_SECRET>".
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const ok = !!secret && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return new Response("Não autorizado", { status: 401 });
  const result = await purgeExpiredPhotos();
  return Response.json({ ok: true, result });
}

export const GET = handle;
export const POST = handle;
