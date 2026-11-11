import { baseUrl } from "./config";

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
  return baseUrl() + path;
}

export function personalLink(token: string): string {
  return appUrl(`/p/${token}`);
}

/** Link curto que abre direto a tela de registrar atividade. É o link que vai no WhatsApp. */
export function registerLink(token: string): string {
  return appUrl(`/r/${token}`);
}

/**
 * Mensagem com o link de registro, para o WhatsApp pessoal do participante.
 * O WhatsApp não aceita link "escondido" atrás de um texto: o endereço aparece inteiro,
 * por isso ele fica sozinho numa linha, logo depois da instrução.
 */
export function registerLinkMessage(opts: { firstName?: string; challengeName: string; token: string; confirmed?: boolean }): string {
  const hello = opts.firstName ? `Oi, ${opts.firstName}! ` : "";
  const status = opts.confirmed ? `Sua inscrição no ${opts.challengeName} está confirmada.\n\n` : "";
  return (
    `${hello}${status}Para registrar suas corridas e caminhadas${opts.confirmed ? "" : ` do ${opts.challengeName}`}, toque aqui:\n` +
    `${registerLink(opts.token)}\n\n` +
    `É só anotar os km e mandar a foto. Guarde esta mensagem!`
  );
}
