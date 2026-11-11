import { eq } from "drizzle-orm";
import { db } from "@/db";
import { participants, teams } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { getChallenge, standings } from "@/lib/queries";
import { formatKm, formatWhatsapp } from "@/lib/format";
import { personalLink, registerLink } from "@/lib/whatsapp";
import { csvResponse } from "@/lib/csv";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) return new Response("Não autorizado", { status: 401 });
  const { slug } = await params;
  const c = await getChallenge(slug);
  if (!c) return new Response("Não encontrado", { status: 404 });

  const [people, addresses] = await Promise.all([
    standings(c.id),
    db.select({ p: participants, teamName: teams.name }).from(participants).leftJoin(teams, eq(teams.id, participants.teamId)).where(eq(participants.challengeId, c.id)),
  ]);
  const totals = new Map(people.map((p) => [p.id, p]));
  const kitGoal = c.goals[0] ?? 42;

  const header = [
    "Nome", "WhatsApp", "Turma", "Camiseta", "Km", "Meta (km)", "Completou kit", "Pagamento", "Kit enviado",
    "CEP", "Rua", "Número", "Complemento", "Bairro", "Cidade", "UF", "Link de registro", "Página pessoal", "Inscrito em",
  ];
  const lines = addresses
    .sort((a, b) => a.p.name.localeCompare(b.p.name, "pt-BR"))
    .map(({ p, teamName }) => {
      const m = totals.get(p.id)?.meters ?? 0;
      return [
        p.name, formatWhatsapp(p.whatsapp), teamName ?? "", p.shirtSize, formatKm(m), p.goalKm,
        m >= kitGoal * 1000 ? "sim" : "não", p.paidAt ? "pago" : "pendente", p.kitSentAt ? "sim" : "não",
        p.cep, p.street, p.number, p.complement, p.neighborhood, p.city, p.state, registerLink(p.token), personalLink(p.token),
        p.createdAt.toISOString().slice(0, 10),
      ];
    });

  return csvResponse([header, ...lines], `inscritos-${c.slug}.csv`);
}
