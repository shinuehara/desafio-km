import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ProgressBar } from "@/components/ui";
import { IconPlus, IconRun, IconTrophy } from "@/components/Icons";
import { SubmitButton } from "@/components/client";
import { participantActivities } from "@/lib/queries";
import { deadlineLabel, weekdayDate, challengePhase, todayISO } from "@/lib/dates";
import { cumulativeByDay } from "@/lib/progress";
import { ProgressChart } from "@/components/ProgressChart";
import { firstName, formatKm, percent } from "@/lib/format";
import { loadParticipant } from "./load";
import { acceptNextGoal, declineNextGoal } from "./actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const { challenge } = await loadParticipant(token);
  return {
    title: challenge.name,
    manifest: `/p/${token}/manifest.webmanifest`,
    robots: { index: false, follow: false },
  };
}

export default async function ParticipantHome({ params }: Props) {
  const { token } = await params;
  const { participant: p, challenge: c, team } = await loadParticipant(token);
  const list = await participantActivities(p.id);
  const valid = list.filter((a) => !a.invalidatedAt);
  const total = valid.reduce((s, a) => s + a.distanceM, 0);
  const pct = percent(total, p.goalKm);
  const remaining = Math.max(0, p.goalKm * 1000 - total);
  const nextGoal = c.goals.find((g) => g > p.goalKm);
  const declined = (await cookies()).get(`dkm_meta_${token}`)?.value === "nao";
  const showUpsell = !!nextGoal && total >= p.goalKm * 1000 && !declined;
  const kitGoal = c.goals[0] ?? 42;
  const phase = challengePhase(c.startDate, c.endDate);

  return (
    <main className="phone">
      <div className="row-between" style={{ flexWrap: "nowrap" }}>
        <div>
          <div className="small muted">{c.name} · {deadlineLabel(c.startDate, c.endDate)}</div>
          <h1 style={{ marginTop: 2 }}>Oi, {firstName(p.name)}!</h1>
        </div>
        <span className="brand-mark" style={{ width: 44, height: 44, borderRadius: 12, fontSize: 14 }}>km</span>
      </div>

      {p.paidAt ? (
        <span className="chip chip-ok">Inscrição confirmada{p.kitSentAt ? " · kit enviado" : ""}</span>
      ) : (
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <span className="chip chip-warn">Pagamento em confirmação</span>
          <Link href={`/p/${token}/pagamento`} className="small">Ver o PIX de novo</Link>
        </div>
      )}

      <section className="card stack">
        <div className="row" style={{ alignItems: "baseline", gap: 8 }}>
          <span className="big-number">{formatKm(total)}</span>
          <span className="muted" style={{ fontSize: 18 }}>de {p.goalKm} km</span>
        </div>
        <ProgressBar meters={total} goalKm={p.goalKm} label="Seu progresso no desafio" />
        <div>
          <b>{pct}%</b> concluído · {remaining > 0 ? `faltam ${formatKm(remaining)} km` : "meta concluída"}
        </div>
        {p.goalKm > kitGoal && <div className="small muted">Você já garantiu o kit ao completar {kitGoal} km.</div>}
      </section>

      {showUpsell && (
        <section className="card-dark">
          <h2 style={{ fontSize: 22 }}>Você completou os {p.goalKm} km!</h2>
          <p>Quer continuar até <b style={{ color: "#fff" }}>{nextGoal} km</b>? É opcional, e o seu kit já está garantido.</p>
          <form action={acceptNextGoal.bind(null, token)}>
            <SubmitButton className="btn" pendingText="Só um instante…">Sim, quero ir até {nextGoal} km</SubmitButton>
          </form>
          <form action={declineNextGoal.bind(null, token)}>
            <button type="submit" className="btn btn-link" style={{ color: "#e7e5e0" }}>Agora não</button>
          </form>
        </section>
      )}

      {phase === "after" ? (
        <div className="alert alert-warn">O desafio terminou. Obrigado por participar!</div>
      ) : (
        <Link href={`/p/${token}/registrar`} className="btn btn-primary btn-big">
          <IconPlus size={26} /> Registrar atividade
        </Link>
      )}
      <Link href={`/d/${c.slug}/ranking?p=${token}`} className="btn">
        <IconTrophy /> Ver o ranking{team ? ` da turma ${team.name}` : ""}
      </Link>

      <section className="card stack">
        <h2 style={{ fontSize: 18 }}>Sua evolução</h2>
        <ProgressChart
          points={cumulativeByDay(list)}
          startDate={c.startDate}
          endDate={c.endDate}
          today={todayISO()}
          goalKm={p.goalKm}
        />
      </section>

      <section className="stack">
        <h2>Suas atividades</h2>
        {list.length === 0 && <p className="muted">Ainda nada por aqui. Depois da sua primeira caminhada ou corrida, toque em “Registrar atividade”.</p>}
        {list.map((a) => (
          <div key={a.id} className="list-item" style={a.invalidatedAt ? { opacity: 0.6 } : undefined}>
            <div className="icon-box"><IconRun /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="strong">{weekdayDate(a.activityDate)}</div>
              <div className="small muted">{a.invalidatedAt ? "Não contou: o organizador não validou" : "Foto enviada"}</div>
            </div>
            <div style={{ font: "700 18px var(--display)", textDecoration: a.invalidatedAt ? "line-through" : undefined }}>
              {formatKm(a.distanceM)} km
            </div>
          </div>
        ))}
      </section>

      <p className="small muted center">
        Este é o seu link pessoal. Guarde nos favoritos ou toque em <b>Adicionar à tela inicial</b> no menu do navegador.
      </p>
    </main>
  );
}
