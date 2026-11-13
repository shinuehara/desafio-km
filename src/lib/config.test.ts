import { afterEach, describe, expect, it, vi } from "vitest";
import { configIssues } from "./config";

afterEach(() => vi.unstubAllEnvs());

describe("diagnóstico de configuração", () => {
  it("aponta SESSION_SECRET curta como erro", () => {
    vi.stubEnv("SESSION_SECRET", "curta");
    vi.stubEnv("ADMIN_PASSWORD", "Uma-Senha-Forte-2026");
    expect(configIssues().some((i) => i.level === "erro" && i.text.includes("SESSION_SECRET"))).toBe(true);
  });
  it("não reclama de SESSION_SECRET longa", () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(40));
    vi.stubEnv("ADMIN_PASSWORD", "Uma-Senha-Forte-2026");
    expect(configIssues().some((i) => i.text.includes("SESSION_SECRET"))).toBe(false);
  });
});
