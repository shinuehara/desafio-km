/**
 * Endereços do banco a partir das variáveis de ambiente, com as limpezas que evitam erros comuns:
 * aspas coladas junto ("postgresql://..."), espaços, e parâmetros de outras ferramentas
 * (o Supabase sugere ?pgbouncer=true, que é do Prisma e não do nosso driver).
 */
const FOREIGN_PARAMS = ["pgbouncer", "connection_limit", "pool_timeout", "schema"];

export function cleanDbUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let s = raw.trim().replace(/^["']|["']$/g, "").trim();
  if (!s) return undefined;
  try {
    const u = new URL(s);
    for (const p of FOREIGN_PARAMS) u.searchParams.delete(p);
    s = u.toString();
  } catch {
    // não é uma URL válida: devolve como está e o driver mostra o erro
  }
  return s;
}

/** Conexão usada pelo site (no Supabase: "Transaction pooler", porta 6543). */
export function appDbUrl(): string | undefined {
  return cleanDbUrl(process.env.DATABASE_URL);
}

/** Conexão para criar/atualizar tabelas (no Supabase: "Session pooler", porta 5432). */
export function migrationDbUrl(): string | undefined {
  return cleanDbUrl(process.env.DATABASE_URL_DIRECT || process.env.DIRECT_URL || process.env.DATABASE_URL);
}

/** Bancos fora do computador local usam conexão criptografada. */
export function sslFor(url: string): "require" | false {
  try {
    const u = new URL(url);
    if (u.searchParams.has("sslmode")) return false; // o próprio endereço decide
    return ["localhost", "127.0.0.1", "::1"].includes(u.hostname) ? false : "require";
  } catch {
    return false;
  }
}
