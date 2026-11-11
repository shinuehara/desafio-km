import Link from "next/link";
import { notFound } from "next/navigation";
import { BackBar } from "@/components/ui";
import { ProgressBar } from "@/components/ui";
import { getByToken, getChallenge, listTeams, standings } from "@/lib/queries";
import { formatKm, percent } from "@/lib/format";
import { isTokenShape } from "@/lib/token";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ranking" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ turma?: string; p?: string }> };

/** No ranking público aparece só o primeiro nome e a inicial do sobrenome. */
function publicName(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

export default async function RankingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const c = await getChallenge(slug);
  if (!c) notFound();

  const me = sp.p && isTokenShape(sp.p) ? await getByToken(sp.p) : null;
  const meId = me && me.challenge.id === c.id ? me.participant.id : null;
  const all = await standings(c.id);
  // Turmas sem ninguém inscrito não aparecem nas abas do ranking.
  const teams = (await listTeams(c.id)).filter((t) => all.some((r) => r.teamId === t.id));
  const kitGoal = c.goals[0] ?? 42;

  const defaultTab = me?.team?.slug ?? "geral";
  const tab = sp.turma && (sp.turma === "geral" || teams.some((t) => t.slug === sp.turma)) ? sp.turma : defaultTab;
  const team = teams.find((t) => t.slug === tab);
  const rows = team ? all.filter((r) => r.teamId === team.id) : all;
  const sum = rows.reduce((s, r) => s + r.meters, 0);
  const pQuery = meId && sp.p ? `&p=${sp.p}` : "";

  return (
    <>
      <BackBar href={meId && sp.p ? `/p/${sp.p}` : `/d/${c.slug}`} />
      <main className="phone">
        <div>
          <h1>Ranking</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Todo mundo que chega aos {kitGoal} km ganha o kit. O ranking é só para animar.
          </p>
        </div>

        {teams.length > 0 && (
          <nav className="tabs" aria-label="Turmas">
            {teams.map((t) => (
              <Link key={t.id} href={`?turma=${t.slug}${pQuery}`} aria-current={tab === t.slug ? "page" : undefined}>{t.name}</Link>
            ))}
            <Link href={`?turma=geral${pQuery}`} aria-current={tab === "geral" ? "page" : undefined}>Geral</Link>
          </nav>
        )}

        <div className="row-between small muted">
          <span>{rows.length} {rows.length === 1 ? "pessoa" : "pessoas"}</span>
          <span>{formatKm(sum)} km somados</span>
        </div>

        <div className="stack">
          {rows.length === 0 && <p className="muted">Ninguém por aqui ainda.</p>}
          {rows.map((r, i) => {
            const isMe = r.id === meId;
            return (
              <div key={r.id} className={`rank-row${isMe ? " me" : ""}`}>
                <div className="row">
                  <div className="rank-pos">{i + 1}º</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="strong">{publicName(r.name)}{isMe ? " (você)" : ""}</div>
                    <div className="tiny muted">
                      {tab === "geral" && r.teamName ? `Turma ${r.teamName} · ` : ""}
                      {r.meters >= kitGoal * 1000 ? `completou os ${kitGoal} km` : `${percent(r.meters, kitGoal)}% dos ${kitGoal} km`}
                    </div>
                  </div>
                  <div style={{ font: "700 17px var(--display)" }}>{formatKm(r.meters)} km</div>
                </div>
                <div style={{ marginLeft: 46 }}>
                  <ProgressBar meters={r.meters} goalKm={kitGoal} small />
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
