/**
 * Links do WhatsApp (wa.me). Abrem o app com a mensagem pronta; a pessoa só toca em enviar.
 * Não usam a API do WhatsApp, então não têm custo nem risco de bloqueio do número.
 */

/** Abre a conversa com um número específico. */
export function waTo(phoneDigits: string, text: string): string {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;
}

/** Abre o WhatsApp para a pessoa escolher a conversa (ex.: o grupo do desafio). */
export function waShare(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function appUrl(path = ""): string {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  return base + path;
}

export function personalLink(token: string): string {
  return appUrl(`/p/${token}`);
}
