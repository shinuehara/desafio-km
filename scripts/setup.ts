/**
 * Prepara o ambiente: cria/atualiza as tabelas e as pastas (buckets) de arquivos.
 * Roda sozinho em cada publicação na Netlify (veja netlify.toml) e pode ser rodado à mão:
 *   npm run setup
 * Sem as variáveis, apenas avisa e segue (não quebra o build de quem só quer testar).
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { supabaseAuthHeaders, supabaseSecretKey } from "../src/lib/supabase-headers";

async function migrateDb() {
  // Para migrações, o Supabase recomenda a conexão "Session pooler" (porta 5432).
  const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
  if (!url) {
    console.warn("⚠ DATABASE_URL não configurada: pulando as tabelas.");
    return;
  }
  const pg = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(pg), { migrationsFolder: "./drizzle" });
    console.log("✓ Tabelas atualizadas.");
  } finally {
    await pg.end();
  }
}

async function ensureBuckets() {
  const base = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = supabaseSecretKey();
  if (!base || !key) {
    console.warn("⚠ SUPABASE_URL/SUPABASE_SECRET_KEY não configuradas: pulando as pastas de arquivos.");
    return;
  }
  const headers = { ...supabaseAuthHeaders(key), "Content-Type": "application/json" };
  const wanted = [
    { id: "publico", public: true }, // regulamento e foto do kit
    { id: "fotos", public: false }, // fotos das atividades: só o organizador vê
  ];
  for (const b of wanted) {
    const res = await fetch(`${base}/storage/v1/bucket/${b.id}`, { headers });
    if (res.status === 401 || res.status === 403) {
      throw new Error("O Supabase recusou a chave. Confira SUPABASE_SECRET_KEY: use a chave secreta (\"service_role\" ou \"sb_secret_...\"), nunca a \"anon\" ou a \"publishable\".");
    }
    if (res.ok) {
      const current = (await res.json()) as { public: boolean };
      if (current.public !== b.public) {
        const up = await fetch(`${base}/storage/v1/bucket/${b.id}`, { method: "PUT", headers, body: JSON.stringify({ public: b.public }) });
        if (!up.ok) throw new Error(`Não consegui ajustar a pasta "${b.id}": ${await up.text()}`);
        console.log(`✓ Pasta "${b.id}" ajustada para ${b.public ? "pública" : "privada"}.`);
      } else {
        console.log(`✓ Pasta "${b.id}" já existe.`);
      }
      continue;
    }
    const create = await fetch(`${base}/storage/v1/bucket`, {
      method: "POST",
      headers,
      body: JSON.stringify({ id: b.id, name: b.id, public: b.public, file_size_limit: 5 * 1024 * 1024 }),
    });
    if (!create.ok) throw new Error(`Não consegui criar a pasta "${b.id}": ${await create.text()}`);
    console.log(`✓ Pasta "${b.id}" criada (${b.public ? "pública" : "privada"}).`);
  }
}

async function main() {
  await migrateDb();
  await ensureBuckets();
}

main().catch((e) => {
  console.error("✗ Falha na preparação:", e instanceof Error ? e.message : e);
  process.exit(1);
});
