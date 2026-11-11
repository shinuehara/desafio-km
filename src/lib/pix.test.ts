import { describe, expect, it } from "vitest";
import { crc16, pixPayload, pixText } from "./pix";

describe("pix", () => {
  it("reproduz o exemplo oficial do manual do BR Code (Banco Central)", () => {
    const code = pixPayload({
      key: "123e4567-e12b-12d1-a456-426655440000",
      name: "Fulano de Tal",
      city: "BRASILIA",
    });
    expect(code).toBe(
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D",
    );
  });

  it("inclui valor e txid e fecha com CRC válido", () => {
    const code = pixPayload({ key: "+5511912345678", name: "José Conceição", city: "São Paulo", amountCents: 12000, txid: "DKM-abc123" });
    expect(code).toContain("5406120.00");
    expect(code).toContain("5914Jose Conceicao");
    expect(code).toContain("6009Sao Paulo");
    expect(code).toContain("0509DKMabc123");
    const body = code.slice(0, -4);
    expect(code.slice(-4)).toBe(crc16(body));
  });

  it("limpa acentos e corta no tamanho", () => {
    expect(pixText("Ação Ótima Çidade Muito Grande Mesmo", 15)).toBe("Acao Otima Cida");
  });

  it("exige chave", () => {
    expect(() => pixPayload({ key: " ", name: "a", city: "b" })).toThrow();
  });
});
