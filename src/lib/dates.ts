/** Datas no fuso de Brasília, no formato do banco (AAAA-MM-DD). */

const TZ = "America/Sao_Paulo";

export function todayISO(now: Date = new Date()): string {
  // en-CA formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = Date.UTC(+fromISO.slice(0, 4), +fromISO.slice(5, 7) - 1, +fromISO.slice(8, 10));
  const b = Date.UTC(+toISO.slice(0, 4), +toISO.slice(5, 7) - 1, +toISO.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

/** "2026-10-15" → "15/10" */
export function shortDate(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/** "2026-11-08" → "sáb, 08/11" */
export function weekdayDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  const wd = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" })
    .format(d)
    .replace(".", "");
  return `${wd}, ${shortDate(iso)}`;
}

export function dateTimeBR(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export type ChallengePhase = "before" | "running" | "after";

export function challengePhase(startISO: string, endISO: string, today = todayISO()): ChallengePhase {
  if (today < startISO) return "before";
  if (today > endISO) return "after";
  return "running";
}

/** Texto curto sobre o prazo: "faltam 44 dias", "último dia", "começa em 3 dias", "encerrado". */
export function deadlineLabel(startISO: string, endISO: string, today = todayISO()): string {
  const phase = challengePhase(startISO, endISO, today);
  if (phase === "after") return "desafio encerrado";
  if (phase === "before") {
    const n = daysBetween(today, startISO);
    return n === 1 ? "começa amanhã" : `começa em ${n} dias`;
  }
  const n = daysBetween(today, endISO);
  if (n === 0) return "último dia";
  return n === 1 ? "falta 1 dia" : `faltam ${n} dias`;
}
