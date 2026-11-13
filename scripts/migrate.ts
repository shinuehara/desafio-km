import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { migrationDbUrl, sslFor } from "../src/db/url";

async function main() {
  const url = migrationDbUrl();
  if (!url) throw new Error("DATABASE_URL não configurada");
  const pg = postgres(url, { prepare: false, max: 1, ssl: sslFor(url) });
  await migrate(drizzle(pg), { migrationsFolder: "./drizzle" });
  await pg.end();
  console.log("Banco atualizado.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
