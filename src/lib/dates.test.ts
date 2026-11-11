import { describe, expect, it } from "vitest";
import { addDaysISO, challengePhase, daysBetween, deadlineLabel, todayISO, weekdayDate } from "./dates";

describe("datas", () => {
  it("usa o fuso de Brasília", () => {
    // 02:00 UTC de 11/11 ainda é 10/11 em Brasília (UTC-3).
    expect(todayISO(new Date("2026-11-11T02:00:00Z"))).toBe("2026-11-10");
  });

  it("soma dias e conta intervalos", () => {
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-11-10", "2026-12-24")).toBe(44);
  });

  it("descreve o prazo", () => {
    expect(deadlineLabel("2026-10-15", "2026-12-24", "2026-11-10")).toBe("faltam 44 dias");
    expect(deadlineLabel("2026-10-15", "2026-12-24", "2026-12-24")).toBe("último dia");
    expect(deadlineLabel("2026-10-15", "2026-12-24", "2026-12-25")).toBe("desafio encerrado");
    expect(challengePhase("2026-10-15", "2026-12-24", "2026-10-01")).toBe("before");
  });

  it("mostra dia da semana", () => {
    expect(weekdayDate("2026-11-08")).toBe("dom, 08/11");
  });
});
