/**
 * Gera o código "PIX Copia e Cola" (BR Code estático, padrão EMV do Banco Central).
 * O mesmo texto vira o QR Code.
 */

function field(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  if (value.length > 99) throw new Error(`Campo PIX ${id} longo demais`);
  return id + len + value;
}

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido pelo BR Code. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Remove acentos e caracteres fora do conjunto aceito pelos bancos. */
export function pixText(value: string, max: number): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .,\-/]/g, "")
    .trim()
    .slice(0, max);
}

export type PixInput = {
  key: string;
  name: string;
  city: string;
  /** Valor em centavos. Omitido ou 0 = a pessoa digita o valor no banco. */
  amountCents?: number;
  /** Identificador que aparece no extrato de alguns bancos (até 25 letras/números). */
  txid?: string;
};

export function pixPayload({ key, name, city, amountCents, txid }: PixInput): string {
  const cleanKey = key.trim();
  if (!cleanKey) throw new Error("Chave PIX não configurada");
  const merchant = field("00", "br.gov.bcb.pix") + field("01", cleanKey);
  const tx = (txid ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";

  let payload =
    field("00", "01") +
    field("26", merchant) +
    field("52", "0000") +
    field("53", "986") +
    (amountCents && amountCents > 0 ? field("54", (amountCents / 100).toFixed(2)) : "") +
    field("58", "BR") +
    field("59", pixText(name, 25) || "RECEBEDOR") +
    field("60", pixText(city, 15) || "BRASIL") +
    field("62", field("05", tx)) +
    "6304";
  payload += crc16(payload);
  return payload;
}
