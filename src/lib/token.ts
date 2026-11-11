import { randomInt } from "node:crypto";

// Sem letras/números parecidos (0/O, 1/l/I), para quem precisar ler o link em voz alta.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Token do link pessoal. 10 caracteres ≈ 49 bits: impossível de adivinhar na prática. */
export function newToken(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function isTokenShape(value: string): boolean {
  return /^[a-z0-9]{6,32}$/.test(value);
}
