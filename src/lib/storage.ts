import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Arquivos enviados: fotos das atividades (privadas, só o organizador vê) e
 * arquivos públicos do desafio (regulamento em PDF, foto do kit).
 *
 * Em produção usa o Supabase Storage. Sem SUPABASE_URL, grava em .data/ (desenvolvimento).
 */
export type Bucket = "publico" | "fotos";

const LOCAL_ROOT = path.join(process.cwd(), ".data");

function supabase() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

export function extensionFor(contentType: string): string | null {
  return EXT[contentType] ?? null;
}

export function newKey(prefix: string, contentType: string): string {
  const ext = extensionFor(contentType) ?? "bin";
  return `${prefix}/${randomUUID()}.${ext}`;
}

function safeLocalPath(bucket: Bucket, key: string): string {
  const p = path.join(LOCAL_ROOT, bucket, key);
  if (!p.startsWith(path.join(LOCAL_ROOT, bucket) + path.sep)) throw new Error("Caminho inválido");
  return p;
}

export async function putFile(bucket: Bucket, key: string, data: Buffer, contentType: string) {
  const sb = supabase();
  if (sb) {
    const res = await fetch(`${sb.url}/storage/v1/object/${bucket}/${key}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sb.key}`,
        apikey: sb.key,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: new Uint8Array(data),
    });
    if (!res.ok) throw new Error(`Falha ao enviar arquivo (${res.status}): ${await res.text()}`);
    return;
  }
  const p = safeLocalPath(bucket, key);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, data);
}

/** Apaga arquivos (ignora os que já não existem). */
export async function deleteFiles(bucket: Bucket, keys: string[]) {
  if (keys.length === 0) return;
  const sb = supabase();
  for (let i = 0; i < keys.length; i += 100) {
    const batch = keys.slice(i, i + 100);
    if (sb) {
      const res = await fetch(`${sb.url}/storage/v1/object/${bucket}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sb.key}`, apikey: sb.key, "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: batch }),
      });
      if (!res.ok) throw new Error(`Falha ao apagar arquivos (${res.status}): ${await res.text()}`);
    } else {
      await Promise.all(batch.map((k) => rm(safeLocalPath(bucket, k), { force: true })));
    }
  }
}

/** Leitura local (rota /api/arquivos). No Supabase os arquivos são servidos por ele. */
export async function readLocalFile(bucket: Bucket, key: string): Promise<Buffer | null> {
  try {
    return await readFile(safeLocalPath(bucket, key));
  } catch {
    return null;
  }
}

export function publicUrl(key: string): string {
  const sb = supabase();
  if (sb) return `${sb.url}/storage/v1/object/public/publico/${key}`;
  return `/api/arquivos/publico/${key}`;
}

/** URLs temporárias das fotos (privadas). Use só em páginas do organizador. */
export async function privatePhotoUrls(keys: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (keys.length === 0) return out;
  const sb = supabase();
  if (!sb) {
    for (const k of keys) out[k] = `/api/arquivos/fotos/${k}`;
    return out;
  }
  const res = await fetch(`${sb.url}/storage/v1/object/sign/fotos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sb.key}`,
      apikey: sb.key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: 60 * 60, paths: keys }),
  });
  if (!res.ok) throw new Error(`Falha ao gerar links das fotos (${res.status})`);
  const list = (await res.json()) as { path: string; signedURL: string | null }[];
  for (const item of list) {
    if (item.signedURL) out[item.path] = `${sb.url}/storage/v1${item.signedURL}`;
  }
  return out;
}
