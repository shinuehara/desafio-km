import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const pg = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
  await migrate(drizzle(pg), { migrationsFolder: "./drizzle" });
  await pg.end();
  console.log("Banco atualizado.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
