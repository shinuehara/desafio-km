import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { appDbUrl, sslFor } from "./url";

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

function client() {
  const url = appDbUrl();
  if (!url) throw new Error("DATABASE_URL não configurada");
  // prepare: false é necessário no "transaction pooler" do Supabase.
  return postgres(url, { prepare: false, max: 5, ssl: sslFor(url) });
}

const pg = globalForDb.pg ?? client();
if (process.env.NODE_ENV !== "production") globalForDb.pg = pg;

export const db = drizzle(pg, { schema });
export { schema };
