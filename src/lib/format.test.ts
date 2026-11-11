import { describe, expect, it } from "vitest";
import { formatKm, normalizeWhatsapp, parseKmToMeters, parseMoneyToCents, percent, slugify } from "./format";

describe("parseKmToMeters", () => {
  it.each([
    ["5", 5000],
    ["5,2", 5200],
    ["5.25", 5250],
    [" 10 km ", 10000],
    ["0,8", 800],
  ])("%s → %d m", (input, m) => expect(parseKmToMeters(input)).toBe(m));

  it.each(["", "0", "abc", "-3", "5,2,1"])("rejeita %j", (input) => expect(parseKmToMeters(input)).toBeNull());
});

describe("dinheiro e telefone", () => {
  it("converte valores em reais", () => {
    expect(parseMoneyToCents("120,00")).toBe(12000);
    expect(parseMoneyToCents("R$ 1.250,5")).toBe(125050);
    expect(parseMoneyToCents("abc")).toBeNull();
  });

  it("normaliza WhatsApp brasileiro", () => {
    expect(normalizeWhatsapp("(11) 91234-5678")).toBe("5511912345678");
    expect(normalizeWhatsapp("+55 11 91234-5678")).toBe("5511912345678");
    expect(normalizeWhatsapp("011 91234 5678")).toBe("5511912345678");
    expect(normalizeWhatsapp("1234")).toBeNull();
  });
});

describe("outros", () => {
  it("formata km e percentuais", () => {
    expect(formatKm(42195)).toBe("42,2");
    expect(percent(21000, 42)).toBe(50);
    expect(percent(50000, 42)).toBe(100);
  });

  it("cria endereços simples", () => {
    expect(slugify("Família Ação 2026!")).toBe("familia-acao-2026");
  });
});
