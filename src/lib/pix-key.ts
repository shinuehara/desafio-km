/**
 * Reconhece o tipo da chave PIX e devolve no formato que os bancos esperam
 * (padrão do Banco Central): CPF/CNPJ só números, celular +55DDDNÚMERO,
 * e-mail em minúsculas, chave aleatória (EVP) em minúsculas com hífens.
 */
export type PixKeyType = "cpf" | "cnpj" | "celular" | "email" | "aleatoria";
export type PixKeyResult = { ok: true; type: PixKeyType; value: string; label: string } | { ok: false; error: string };

const digits = (s: string) => s.replace(/\D/g, "");

export function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export function isValidCnpj(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((s, w, i) => s + w * Number(cnpj[i]), 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
}

const EVP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function maskCpf(c: string) {
  return `***.${c.slice(3, 6)}.${c.slice(6, 9)}-**`;
}
function formatPhone(p: string) {
  const n = p.slice(3); // sem +55
  return `+55 (${n.slice(0, 2)}) ${n.slice(2, n.length - 4)}-${n.slice(-4)}`;
}

export function normalizePixKey(raw: string): PixKeyResult {
  const s = raw.trim();
  if (!s) return { ok: false, error: "Informe a chave PIX." };

  const lower = s.toLowerCase();
  if (EVP.test(lower)) return { ok: true, type: "aleatoria", value: lower, label: `Chave aleatória ${lower.slice(0, 8)}…` };
  if (s.includes("@")) {
    return EMAIL.test(lower) && lower.length <= 77
      ? { ok: true, type: "email", value: lower, label: `E-mail ${lower}` }
      : { ok: false, error: "Esse e-mail não parece válido. Confira a chave PIX." };
  }

  const d = digits(s);
  const startsPlus = s.startsWith("+");

  // CNPJ
  if (!startsPlus && d.length === 14) {
    return isValidCnpj(d) ? { ok: true, type: "cnpj", value: d, label: `CNPJ ${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` }
      : { ok: false, error: "Esse CNPJ tem algum número errado. Confira a chave PIX." };
  }
  // 11 dígitos sem +: pode ser CPF ou celular sem o +55. O dígito verificador do CPF desempata.
  if (!startsPlus && d.length === 11) {
    // Escrito no formato de CPF (000.000.000-00): só pode ser CPF.
    if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(s)) {
      return isValidCpf(d) ? { ok: true, type: "cpf", value: d, label: `CPF ${maskCpf(d)}` } : { ok: false, error: "Esse CPF tem algum número errado. Confira a chave PIX." };
    }
    if (isValidCpf(d) && !/[()]/.test(s)) return { ok: true, type: "cpf", value: d, label: `CPF ${maskCpf(d)}` };
    if (/^\d{2}9\d{8}$/.test(d)) return { ok: true, type: "celular", value: `+55${d}`, label: `Celular ${formatPhone(`+55${d}`)}` };
    return { ok: false, error: "Esse CPF tem algum número errado. Confira a chave PIX." };
  }
  // Celular com DDI 55
  if (d.length === 13 && d.startsWith("55") && /^55\d{2}9\d{8}$/.test(d)) {
    return { ok: true, type: "celular", value: `+${d}`, label: `Celular ${formatPhone(`+${d}`)}` };
  }
  if (startsPlus) return { ok: false, error: "Celular como chave PIX: use o formato +55 DDD número, ex.: +55 11 91234-5678." };

  return { ok: false, error: "Não reconheci essa chave PIX. Use CPF, CNPJ, celular (+55…), e-mail ou chave aleatória." };
}
