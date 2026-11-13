import { supabaseSecretKey } from "./supabase-headers";

/**
 * Leitura central da configuração (variáveis de ambiente) e diagnóstico para o painel.
 */

/** Rodando numa hospedagem (Netlify, Vercel…) e não no computador de alguém. */
export function isHosted(): boolean {
  return !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL || process.env.SITE_ID);
}

/** Endereço público do site, sem barra no final. Na Netlify, usa o endereço do site se APP_URL faltar. */
export function baseUrl(): string {
  const raw =
    process.env.APP_URL ||
    process.env.URL || // Netlify
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function supabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && supabaseSecretKey());
}

export type ConfigIssue = { level: "erro" | "aviso"; text: string };

/** O que falta configurar. Mostrado no topo do painel do organizador. */
export function configIssues(): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const hosted = isHosted();
  if (!supabaseConfigured()) {
    issues.push(
      hosted
        ? { level: "erro", text: "SUPABASE_URL e SUPABASE_SECRET_KEY não estão configuradas: fotos, regulamento e foto do kit não podem ser salvos." }
        : { level: "aviso", text: "Sem Supabase: os arquivos estão sendo guardados na pasta .data/ (só serve para testes no computador)." },
    );
  }
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 8) {
    issues.push({ level: "erro", text: "ADMIN_PASSWORD ausente ou curta demais (use pelo menos 8 caracteres)." });
  } else if (/^(troque|teste|admin|senha|123)/i.test(process.env.ADMIN_PASSWORD) && hosted) {
    issues.push({ level: "aviso", text: "ADMIN_PASSWORD parece uma senha de exemplo. Troque por uma senha forte." });
  }
  if (hosted && baseUrl().includes("localhost")) {
    issues.push({ level: "erro", text: "APP_URL não configurada: os links enviados pelo WhatsApp apontariam para localhost." });
  }
  if (hosted && !process.env.CRON_SECRET) {
    issues.push({ level: "aviso", text: "CRON_SECRET não configurada: a limpeza automática das fotos antigas não vai rodar." });
  }
  return issues;
}
