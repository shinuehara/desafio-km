import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { ProgressBar } from "@/components/ui";
import { IconChat, IconTrophy } from "@/components/Icons";
import { totalMeters } from "@/lib/queries";
import { firstName, formatKm, percent } from "@/lib/format";
import { appUrl, waShare } from "@/lib/whatsapp";
import { loadParticipant } from "../../load";

export const dynamic = "force-dynamic";
export const metadata = { title: "Atividade registrada", robots: { index: false } };

export default async function ActivityDone({ params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;
  const { participant: p, challenge: c } = await loadParticipant(token);
  const [a] = await db
    .select()
    .from(activities)
    .where(and(eq(activities.id, Number(id) || 0), eq(activities.participantId, p.id)))
    .limit(1);
  if (!a) notFound();

  const total = await totalMeters(p.id);
  const before = total - (a.invalidatedAt ? 0 : a.distanceM);
  const goalM = p.goalKm * 1000;
  const completed = before < goalM && total >= goalM;
  const kitGoal = c.goals[0] ?? 42;
  const pct = percent(total, p.goalKm);
  const remaining = Math.max(0, goalM - total);
  const name = firstName(p.name);

  const message = completed
    ? `${name} completou os ${p.goalKm} km do ${c.name}! Último registro: +${formatKm(a.distanceM)} km.`
    : `${name} registrou +${formatKm(a.distanceM)} km no ${c.name}. Total: ${formatKm(total)} km (${pct}% da meta de ${p.goalKm} km).`;
  const shareText = `${message}\n\nRanking: ${appUrl(`/d/${c.slug}/ranking`)}`;

  return (
    <main className="phone" style={{ paddingTop: 40 }}>
      <div style={{ width: 84, height: 84, borderRadius: 42, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center" }}>
        <IconTrophy size={44} />
      </div>
      <div className="center">
        <div style={{ font: "700 52px/1 var(--display)", color: "var(--accent)" }}>+{formatKm(a.distanceM)} km</div>
        <h1 style={{ marginTop: 12, fontSize: 26 }}>{completed ? `Você completou os ${p.goalKm} km!` : `Muito bem, ${name}!`}</h1>
        <p style={{ marginTop: 6, color: "var(--ink-2)" }}>
          {completed && p.goalKm === kitGoal
            ? "Sua camiseta e sua medalha vão para o endereço da inscrição."
            : remaining > 0
              ? `Faltam só ${formatKm(remaining)} km para a meta.`
              : "Cada km conta."}
        </p>
      </div>

      <section className="card stack">
        <div className="row-between strong"><span>{formatKm(total)} de {p.goalKm} km</span><span>{pct}%</span></div>
        <ProgressBar meters={total} goalKm={p.goalKm} />
      </section>

      <section className="stack" style={{ gap: 8 }}>
        <div className="small strong muted">Mensagem que vai para o grupo</div>
        <div className="bubble">{message}</div>
      </section>

      <a href={waShare(shareText)} className="btn btn-ok" target="_blank" rel="noopener">
        <IconChat /> Compartilhar no grupo
      </a>
      <Link href={`/p/${token}`} className="btn">Voltar para minha página</Link>
    </main>
  );
}
