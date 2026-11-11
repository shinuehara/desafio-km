/** Formatações em português do Brasil. */

export function formatKm(meters: number): string {
  return (meters / 1000).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "5", "5,2", "5.25" → metros. Retorna null se não for um número válido. */
export function parseKmToMeters(input: string): number | null {
  const clean = input.trim().replace(/\s|km/gi, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(clean)) return null;
  const km = Number(clean);
  if (!Number.isFinite(km) || km <= 0) return null;
  return Math.round(km * 1000);
}

/** "120,00" ou "120" → centavos. */
export function parseMoneyToCents(input: string): number | null {
  const clean = input.trim().replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Normaliza um celular brasileiro para o formato do WhatsApp (55 + DDD + número). */
export function normalizeWhatsapp(input: string): string | null {
  let d = onlyDigits(input);
  if (d.startsWith("0")) d = d.replace(/^0+/, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (!/^55\d{10,11}$/.test(d)) return null;
  return d;
}

export function formatWhatsapp(digits: string): string {
  const d = digits.startsWith("55") ? digits.slice(2) : digits;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function percent(meters: number, goalKm: number): number {
  if (goalKm <= 0) return 0;
  return Math.min(100, Math.floor((meters / (goalKm * 1000)) * 100));
}
