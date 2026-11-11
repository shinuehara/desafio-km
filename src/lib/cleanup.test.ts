import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
const { photosExpireOn } = await import("./cleanup");

describe("limpeza de fotos", () => {
  it("apaga 30 dias depois do fim do desafio", () => {
    expect(photosExpireOn("2026-12-24")).toBe("2027-01-24");
  });
});
