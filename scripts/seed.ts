/**
 * Cria um desafio de exemplo. Uso:
 *   npm run db:seed            → só o desafio (com turmas)
 *   npm run db:seed -- --demo  → também participantes e atividades fictícios (para testar)
 */
import "dotenv/config";
import { deflateSync } from "node:zlib";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { activities, challenges, participants, teams } from "../src/db/schema";
import { newToken } from "../src/lib/token";
import { newKey, putFile } from "../src/lib/storage";
import { addDaysISO, todayISO } from "../src/lib/dates";

/** PNG de uma cor só (foto de exemplo), sem dependências. */
function solidPng(w: number, h: number, [r, g, b]: [number, number, number]): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => [r, g, b]).flat())]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

async function main() {
  const demo = process.argv.includes("--demo");
  const slug = "42km";
  const [exists] = await db.select().from(challenges).where(eq(challenges.slug, slug)).limit(1);
  if (exists) {
    console.log(`O desafio "${slug}" já existe. Nada a fazer.`);
    process.exit(0);
  }

  const [c] = await db
    .insert(challenges)
    .values({
      slug,
      name: "Desafio 42 km",
      startDate: "2026-10-15",
      endDate: "2026-12-24",
      goals: [42, 100],
      priceCents: 12000,
      kitDescription: "Camiseta + medalha",
      pixKey: demo ? "+5511912345678" : "",
      pixName: demo ? "Organizador Exemplo" : "",
      pixCity: demo ? "Campinas" : "",
      organizerName: demo ? "Organizador Exemplo" : "",
      organizerWhatsapp: demo ? "5511912345678" : "",
    })
    .returning();
  const [familia, trabalho] = await db
    .insert(teams)
    .values([
      { challengeId: c.id, name: "Família", slug: "familia" },
      { challengeId: c.id, name: "Trabalho", slug: "trabalho" },
    ])
    .returning();
  console.log(`Desafio criado: /d/${slug}`);

  if (!demo) {
    process.exit(0);
  }

  const people: [string, number, string, number[]][] = [
    ["Ana Paula Souza", familia.id, "M", [10.2, 8, 12, 9.5, 11, 7.5]],
    ["Roberto Lima", familia.id, "G", [5, 6.3, 7, 8, 9.1, 6, 6.5]],
    ["Maria Fernandes", familia.id, "P", [6, 5.2, 4.1, 5, 6.7, 5, 5]],
    ["Lúcia Prado", familia.id, "M", [3.4, 4, 5.2, 5, 5]],
    ["Carla Nogueira", trabalho.id, "P", [5.5, 7, 8, 6, 7.9, 5]],
    ["Rafael Costa", trabalho.id, "G", [8, 7, 8, 8]],
    ["Marcelo Tavares", trabalho.id, "G", [8]],
  ];
  const today = todayISO();
  const colors: [number, number, number][] = [[31, 41, 55], [234, 88, 12], [17, 17, 17], [22, 101, 52]];
  let i = 0;
  for (const [name, teamId, size, kms] of people) {
    i++;
    const [p] = await db
      .insert(participants)
      .values({
        challengeId: c.id, teamId, token: newToken(), name, whatsapp: `55119000000${String(i).padStart(2, "0")}`,
        shirtSize: size, cep: "13010000", street: "Rua Exemplo", number: String(100 + i), city: "Campinas", state: "SP",
        goalKm: kms.reduce((s, k) => s + k, 0) >= 42 ? 100 : 42, acceptedRulesAt: new Date(),
        paidAt: i % 4 === 0 ? null : new Date(),
        paidCents: i % 4 === 0 ? null : 12000,
      })
      .returning();
    for (let d = 0; d < kms.length; d++) {
      const key = newKey(`c${c.id}/p${p.id}`, "image/png");
      await putFile("fotos", key, solidPng(240, 320, colors[(i + d) % colors.length]), "image/png");
      await db.insert(activities).values({ participantId: p.id, distanceM: Math.round(kms[d] * 1000), activityDate: addDaysISO(today, -(d * 3 + 1)), photoKey: key });
    }
    console.log(`  ${name}: /p/${p.token}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
