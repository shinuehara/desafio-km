import { describe, expect, it } from "vitest";
import { cleanDbUrl, sslFor } from "./url";

describe("endereço do banco", () => {
  it("tira aspas, espaços e o ?pgbouncer=true do Prisma", () => {
    expect(cleanDbUrl(' "postgresql://postgres.abc:s3nha@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true" '))
      .toBe("postgresql://postgres.abc:s3nha@aws-0-us-west-2.pooler.supabase.com:6543/postgres");
  });
  it("mantém outros parâmetros", () => {
    expect(cleanDbUrl("postgres://u:p@h:5432/db?sslmode=require&pgbouncer=true")).toBe("postgres://u:p@h:5432/db?sslmode=require");
  });
  it("vazio vira undefined", () => {
    expect(cleanDbUrl("  ")).toBeUndefined();
    expect(cleanDbUrl(undefined)).toBeUndefined();
  });
  it("usa SSL fora do computador local", () => {
    expect(sslFor("postgresql://u:p@aws-0-us-west-2.pooler.supabase.com:6543/postgres")).toBe("require");
    expect(sslFor("postgres://postgres@localhost:5433/desafiokm")).toBe(false);
  });
});
