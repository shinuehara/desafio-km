import { isAdmin } from "@/lib/auth";
import { readLocalFile } from "@/lib/storage";

/** Serve arquivos gravados localmente (só em desenvolvimento, sem Supabase). */
const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf", heic: "image/heic", heif: "image/heif" };

export async function GET(_req: Request, { params }: { params: Promise<{ bucket: string; key: string[] }> }) {
  const { bucket, key } = await params;
  if (bucket !== "publico" && bucket !== "fotos") return new Response("Não encontrado", { status: 404 });
  if (bucket === "fotos" && !(await isAdmin())) return new Response("Não autorizado", { status: 401 });
  const path = key.join("/");
  const data = await readLocalFile(bucket, path);
  if (!data) return new Response("Não encontrado", { status: 404 });
  const ext = path.split(".").pop() ?? "";
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": TYPES[ext] ?? "application/octet-stream", "Cache-Control": "private, max-age=3600" },
  });
}
