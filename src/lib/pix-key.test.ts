import { describe, expect, it } from "vitest";
import { isValidCnpj, isValidCpf, normalizePixKey } from "./pix-key";

// CPF e CNPJ de exemplo com dígitos verificadores válidos (gerados para teste).
const CPF = "52998224725";
const CNPJ = "11222333000181";

describe("chave PIX", () => {
  it("valida dígitos de CPF e CNPJ", () => {
    expect(isValidCpf(CPF)).toBe(true);
    expect(isValidCpf("52998224726")).toBe(false);
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCnpj(CNPJ)).toBe(true);
    expect(isValidCnpj("11222333000182")).toBe(false);
  });

  it("CPF com pontos vira só números", () => {
    expect(normalizePixKey("529.982.247-25")).toMatchObject({ ok: true, type: "cpf", value: CPF });
  });

  it("CNPJ formatado vira só números", () => {
    expect(normalizePixKey("11.222.333/0001-81")).toMatchObject({ ok: true, type: "cnpj", value: CNPJ });
  });

  it("celular em qualquer formato vira +55…", () => {
    expect(normalizePixKey("(11) 91234-5678")).toMatchObject({ ok: true, type: "celular", value: "+5511912345678" });
    expect(normalizePixKey("+55 11 91234-5678")).toMatchObject({ ok: true, type: "celular", value: "+5511912345678" });
    expect(normalizePixKey("5511912345678")).toMatchObject({ ok: true, type: "celular", value: "+5511912345678" });
  });

  it("e-mail em minúsculas e chave aleatória", () => {
    expect(normalizePixKey(" Maria.Souza@Gmail.com ")).toMatchObject({ ok: true, type: "email", value: "maria.souza@gmail.com" });
    expect(normalizePixKey("123E4567-E89B-12D3-A456-426614174000")).toMatchObject({ ok: true, type: "aleatoria", value: "123e4567-e89b-12d3-a456-426614174000" });
  });

  it("recusa chaves inválidas com mensagem clara", () => {
    expect(normalizePixKey("529.982.247-26")).toMatchObject({ ok: false });
    expect(normalizePixKey("maria@")).toMatchObject({ ok: false });
    expect(normalizePixKey("abc")).toMatchObject({ ok: false });
  });
});
