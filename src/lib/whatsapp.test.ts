import { describe, expect, it } from "vitest";
import { registerLink, registerLinkMessage, waTo } from "./whatsapp";

describe("mensagens do WhatsApp", () => {
  it("usa o link curto de registro numa linha própria", () => {
    const msg = registerLinkMessage({ challengeName: "Desafio 42 km", token: "abc123defg" });
    expect(msg.split("\n")).toContain(registerLink("abc123defg"));
    expect(registerLink("abc123defg")).toMatch(/\/r\/abc123defg$/);
    expect(msg).toContain("do Desafio 42 km");
  });

  it("na confirmação, não repete o nome do desafio", () => {
    const msg = registerLinkMessage({ firstName: "Ana", challengeName: "Desafio 42 km", token: "abc123defg", confirmed: true });
    expect(msg.startsWith("Oi, Ana! Sua inscrição no Desafio 42 km está confirmada.")).toBe(true);
    expect(msg.match(/Desafio 42 km/g)).toHaveLength(1);
  });

  it("codifica o texto no link wa.me", () => {
    expect(waTo("5511912345678", "a b\nc")).toBe("https://wa.me/5511912345678?text=a%20b%0Ac");
  });
});
