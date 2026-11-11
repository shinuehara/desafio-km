import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Link curto enviado no WhatsApp: /r/<link> abre direto a tela de registrar atividade
  // (é uma reescrita interna, não um redirecionamento: uma requisição só).
  async rewrites() {
    return [{ source: "/r/:token", destination: "/p/:token/registrar" }];
  },
  async headers() {
    const privateRoute = [
      // Páginas com o link pessoal: nada de buscadores nem de cache compartilhado.
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Cache-Control", value: "private, no-store" },
    ];
    return [
      {
        source: "/:path*",
        headers: [
          // O link pessoal fica no endereço da página: não deixar ele vazar para outros sites
          // (WhatsApp, Google Fonts, ViaCEP…) pelo cabeçalho Referer.
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), payment=()" },
        ],
      },
      { source: "/p/:path*", headers: privateRoute },
      { source: "/r/:path*", headers: privateRoute },
      { source: "/admin/:path*", headers: privateRoute },
    ];
  },
  experimental: {
    // Arquivos até 5 MB (limite das funções da Netlify é ~6 MB por requisição).
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
