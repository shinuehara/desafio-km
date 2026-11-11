import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Link curto enviado no WhatsApp: /r/<link> abre direto a tela de registrar atividade
  // (é uma reescrita interna, não um redirecionamento: uma requisição só).
  async rewrites() {
    return [{ source: "/r/:token", destination: "/p/:token/registrar" }];
  },
  experimental: {
    // Arquivos até 5 MB (limite das funções da Netlify é ~6 MB por requisição).
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
