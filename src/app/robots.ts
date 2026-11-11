import type { MetadataRoute } from "next";

/** Buscadores podem ver a página do desafio e o ranking; nunca links pessoais nem o painel. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: ["/p/", "/r/", "/admin", "/api/"] }] };
}
