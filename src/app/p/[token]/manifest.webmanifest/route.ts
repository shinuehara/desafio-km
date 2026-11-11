import { getByToken } from "@/lib/queries";
import { isTokenShape } from "@/lib/token";

/** Manifesto por participante: "Adicionar à tela inicial" abre direto a página da pessoa. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ctx = isTokenShape(token) ? await getByToken(token) : null;
  if (!ctx) return new Response("Not found", { status: 404 });
  return Response.json(
    {
      name: ctx.challenge.name,
      short_name: "Desafio KM",
      start_url: `/p/${token}`,
      scope: `/p/${token}`,
      display: "standalone",
      background_color: "#f6f5f1",
      theme_color: "#c2410c",
      icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
