import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Arquivos até 5 MB (limite das funções da Netlify é ~6 MB por requisição).
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
