import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Login do organizador: uma senha só (ADMIN_PASSWORD), guardada num cookie assinado.
 * Participantes não fazem login: usam o link pessoal.
 */

const COOKIE = "dkm_admin";
const MAX_AGE_S = 60 * 60 * 24 * 30; // 30 dias

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET ausente ou curta demais");
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Compara os hashes para não vazar o tamanho da senha.
  return safeEqual(sign("pw:" + input), sign("pw:" + expected));
}

export async function startAdminSession() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_S;
  const value = `${exp}.${sign(`admin.${exp}`)}`;
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [expStr, sig] = value.split(".");
  const exp = Number(expStr);
  if (!exp || !sig || exp < Date.now() / 1000) return false;
  return safeEqual(sig, sign(`admin.${exp}`));
}

/** Use no topo de páginas e ações do painel. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/entrar");
}
