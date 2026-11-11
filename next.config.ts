import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Fotos já chegam comprimidas pelo navegador, mas o PDF do regulamento pode ser maior.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
