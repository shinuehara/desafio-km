import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { countInvalid, getChallenge, listTeams, recentActivities, standings } from "@/lib/queries";
import type { Standing } from "@/lib/queries";
import type { Challenge, Team } from "@/db/schema";
import { challengePhase, dateTimeBR, deadlineLabel, shortDate, todayISO, weekdayDate } from "@/lib/dates";
import { photosExpireOn } from "@/lib/cleanup";
import { KIT_IMAGE_JPEG_QUALITY, KIT_IMAGE_MAX_BYTES, KIT_IMAGE_MAX_SIDE_PX, PHOTO_RETENTION_DAYS } from "@/lib/constants";
import { firstName, formatKm, formatMoney, formatWhatsapp, percent } from "@/lib/format";
import { privatePhotoUrls, publicUrl } from "@/lib/storage";
import { appUrl, registerLinkMessage, waTo } from "@/lib/whatsapp";
import { ProgressBar } from "@/components/ui";
import { CopyButton } from "@/components/client";
import { IconDownload, IconLink } from "@/components/Icons";
import {
  addManualKm, addTeam, deleteChallenge, deleteParticipant, purgePhotosNow, removeTeam, setActivityInvalid, setKitSent, setPaid,
  updateChallenge, uploadChallengeFile,
} from "../../actions";
import { ChallengeForm, ConfirmSubmit, DeleteChallengeForm, ManualKmForm, TeamForm, UploadForm } from "../../forms";
import { ConfigBanner } from "../../ConfigBanner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Painel do desafio" };

type Tab = "atividades" | "inscritos" | "ranking" | "config";
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ aba?: string; filtro?: string; turma?: string }>;
};

export default async function AdminChallenge({ params, searchParams }: Props) {
  await requireAdmin();
  const { slug } = await params;
  const sp = await searchParams;
  const c = await getChallenge(slug);
  if (!c) notFound();

  const tab: Tab = (["atividades", "inscritos", "ranking", "config"] as const).find((t) => t === sp.aba) ?? "atividades";
  const [teams, people] = await Promise.all([listTeams(c.id), standings(c.id)]);
  const kitGoal = c.goals[0] ?? 42;
  const pending = people.filter((p) => !p.paidAt).length;
  const received = people.reduce((s, p) => s + (p.paidAt ? (p.paidCents ?? 0) : 0), 0);
  const completed = people.filter((p) => p.meters >= kitGoal * 1000).length;
  const totalM = people.reduce((s, p) => s + p.meters, 0);

  const tabs: [Tab, string][] = [
    ["atividades", "Atividades"],
    ["inscritos", pending ? `Inscritos (${pending} PIX a confirmar)` : "Inscritos"],
    ["ranking", "Ranking"],
    ["config", "Configurar desafio"],
  ];

  return (
    <>
      <header className="admin-top">
        <div className="admin-top-inner">
          <div className="row">
            <span className="brand-mark" style={{ width: 40, height: 40 }}>km</span>
            <div>
              <div style={{ font: "700 20px var(--display)" }}>{c.name}</div>
              <div className="small" style={{ color: "#c9c7c1" }}>
                {shortDate(c.startDate)} a {shortDate(c.endDate)} · {deadlineLabel(c.startDate, c.endDate)} ·{" "}
                <Link href="/admin">todos os desafios</Link>
              </div>
            </div>
          </div>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <a href={`/d/${c.slug}`} target="_blank" rel="noopener" className="btn btn-sm btn-dark" style={{ border: "1px solid #555", minHeight: 44 }}>Ver página do desafio</a>
            <CopyButton text={appUrl(`/d/${c.slug}`)} label="Copiar link de inscrição" className="btn btn-sm btn-primary" />
          </div>
        </div>
      </header>

      <main className="admin">
        <ConfigBanner />
        <div className="stats">
          <div className="stat"><span className="muted">Inscritos</span><b>{people.length}</b></div>
          <div className={`stat${pending ? " warn" : ""}`}><span>PIX a confirmar</span><b>{pending}</b></div>
          <div className="stat"><span className="muted">Completaram {kitGoal} km</span><b>{completed}</b></div>
          <div className="stat"><span className="muted">Km somados</span><b>{formatKm(totalM)}</b></div>
          <div className="stat"><span className="muted">Recebido (PIX confirmados)</span><b>{formatMoney(received)}</b></div>
        </div>

        <nav className="admin-tabs" aria-label="Seções">
          {tabs.map(([id, label]) => (
            <Link key={id} href={`?aba=${id}`} aria-current={tab === id ? "page" : undefined}>{label}</Link>
          ))}
        </nav>

        {tab === "atividades" && <ActivitiesTab c={c} filter={sp.filtro === "invalidadas" ? "invalidadas" : "todas"} />}
        {tab === "inscritos" && <PeopleTab c={c} teams={teams} people={people} teamFilter={sp.turma} />}
        {tab === "ranking" && <RankingTab c={c} teams={teams} people={people} />}
        {tab === "config" && <ConfigTab c={c} teams={teams} people={people} />}
      </main>
    </>
  );
}

// ---------------------------------------------------------------------------

async function ActivitiesTab({ c, filter }: { c: Challenge; filter: "todas" | "invalidadas" }) {
  const [rows, nInvalid] = await Promise.all([recentActivities(c.id, filter === "invalidadas"), countInvalid(c.id)]);
  const urls = await privatePhotoUrls(rows.map((r) => r.activity.photoKey).filter((k): k is string => !!k));

  return (
    <section className="stack-lg">
      <div className="row-between">
        <div>
          <h2>Últimas atividades</h2>
          <p className="small muted">Tudo entra no total na hora. Se a foto não bater com o valor marcado, invalide.</p>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <Link className="filter" href="?aba=atividades" aria-current={filter === "todas" ? "page" : undefined}>Todas</Link>
          <Link className="filter" href="?aba=atividades&filtro=invalidadas" aria-current={filter === "invalidadas" ? "page" : undefined}>Invalidadas ({nInvalid})</Link>
          <a className="filter" href={`/admin/d/${c.slug}/exportar-atividades`}>
            <IconDownload size={16} /> Exportar planilha
          </a>
        </div>
      </div>

      {rows.length === 0 && <p className="muted">Nenhuma atividade {filter === "invalidadas" ? "invalidada" : "registrada"} ainda.</p>}

      <div className="feed">
        {rows.map(({ activity: a, name, teamName }) => {
          const invalid = !!a.invalidatedAt;
          const url = a.photoKey ? urls[a.photoKey] : undefined;
          return (
            <article key={a.id} className={`feed-card${invalid ? " invalid" : ""}`}>
              {a.adminNote ? (
                <div className="feed-photo" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 16, background: "var(--track)", color: "var(--ink-2)", textAlign: "center" }}>
                  <span className="strong">Lançado pelo organizador</span>
                  <span className="small">{a.adminNote}</span>
                </div>
              ) : url ? (
                <a className="feed-photo" href={url} target="_blank" rel="noopener" aria-label={`Abrir foto de ${name} em tamanho grande`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto enviada por ${name}`} loading="lazy" />
                </a>
              ) : (
                <div className="feed-photo" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#c9c7c1", fontSize: 14 }}>
                  Foto apagada
                </div>
              )}
              <div className="feed-body">
                <div className="row-between" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="strong">{name}</div>
                    <div className="tiny muted">
                      {teamName ? `${teamName} · ` : ""}{weekdayDate(a.activityDate)} · enviada {dateTimeBR(a.createdAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="tiny muted">Marcou</div>
                    <div className="km-marked">{formatKm(a.distanceM)} km</div>
                  </div>
                </div>
                {invalid && <div className="alert alert-bad tiny" style={{ padding: "8px 10px" }}>Invalidada · não conta no total</div>}
                <form action={setActivityInvalid.bind(null, a.id, !invalid, c.slug)}>
                  <button type="submit" className={`btn btn-sm${invalid ? " btn-dark" : " btn-danger"}`} style={{ width: "100%" }}>
                    {invalid ? "Desfazer" : "Invalidar"}
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function PeopleTab({ c, teams, people, teamFilter }: { c: Challenge; teams: Team[]; people: Standing[]; teamFilter?: string }) {
  const kitGoal = c.goals[0] ?? 42;
  const team = teams.find((t) => t.slug === teamFilter);
  const rows = (team ? people.filter((p) => p.teamId === team.id) : people).slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const today = todayISO();
  return (
    <section className="stack-lg">
      <ManualKmForm
        action={addManualKm.bind(null, c.id, c.slug)}
        people={people.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map((p) => ({ id: p.id, name: p.name }))}
        minDate={c.startDate}
        maxDate={today < c.endDate ? (today < c.startDate ? c.startDate : today) : c.endDate}
      />
      <div className="row-between">
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <Link className="filter" href="?aba=inscritos" aria-current={!team ? "page" : undefined}>Todas as turmas</Link>
          {teams.map((t) => (
            <Link key={t.id} className="filter" href={`?aba=inscritos&turma=${t.slug}`} aria-current={team?.id === t.id ? "page" : undefined}>{t.name}</Link>
          ))}
        </div>
        <a className="btn btn-sm" href={`/admin/d/${c.slug}/exportar`} style={{ minHeight: 44 }}>
          <IconDownload size={18} /> Exportar planilha (com endereços)
        </a>
      </div>

      <div className="table-box">
        <table className="table">
          <thead>
            <tr>
              <th>Participante</th><th>Turma</th><th>Camiseta</th><th>Pagamento</th><th>Progresso</th><th>Kit</th><th>Link pessoal</th><th><span className="sr-only">Excluir</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} className="muted">Nenhum inscrito ainda.</td></tr>
            )}
            {rows.map((p) => {
              const done = p.meters >= kitGoal * 1000;
              const msg = registerLinkMessage({ firstName: firstName(p.name), challengeName: c.name, token: p.token, confirmed: !!p.paidAt });
              return (
                <tr key={p.id}>
                  <td>
                    <div className="strong">{p.name}</div>
                    <div className="tiny muted">{formatWhatsapp(p.whatsapp)} · {p.city}/{p.state}</div>
                  </td>
                  <td>{p.teamName ?? <span className="muted">—</span>}</td>
                  <td className="strong">{p.shirtSize}</td>
                  <td>
                    <div className="stack">
                      {p.paidAt ? <span className="chip chip-ok">Pago</span> : <span className="chip chip-warn">Aguardando PIX</span>}
                      <form action={setPaid.bind(null, p.id, !p.paidAt, c.slug)}>
                        <button type="submit" className={p.paidAt ? "btn btn-sm btn-link" : "btn btn-sm btn-dark"} style={p.paidAt ? { minHeight: 30, padding: 0 } : undefined}>
                          {p.paidAt ? "Desfazer" : "Confirmar PIX"}
                        </button>
                      </form>
                    </div>
                  </td>
                  <td style={{ minWidth: 170 }}>
                    <div className="stack">
                      <div className="small"><b>{formatKm(p.meters)}</b> / {p.goalKm} km · {percent(p.meters, p.goalKm)}%</div>
                      <ProgressBar meters={p.meters} goalKm={p.goalKm} small />
                    </div>
                  </td>
                  <td>
                    <div className="stack">
                      {p.kitSentAt ? <span className="chip chip-info">Enviado</span> : done ? <span className="chip chip-ok">Pronto para envio</span> : <span className="chip chip-neutral">Ainda correndo</span>}
                      {(p.kitSentAt || done) && (
                        <form action={setKitSent.bind(null, p.id, !p.kitSentAt, c.slug)}>
                          <button type="submit" className={p.kitSentAt ? "btn btn-sm btn-link" : "btn btn-sm btn-dark"} style={p.kitSentAt ? { minHeight: 30, padding: 0 } : undefined}>
                            {p.kitSentAt ? "Desfazer" : "Marcar enviado"}
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                  <td>
                    <a className="btn btn-sm" href={waTo(p.whatsapp, msg)} target="_blank" rel="noopener">Enviar link</a>
                  </td>
                  <td>
                    <form action={deleteParticipant.bind(null, p.id, c.slug)}>
                      <ConfirmSubmit message={`Excluir ${p.name} e todas as atividades? Isso não pode ser desfeito.`}>Excluir</ConfirmSubmit>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function RankingTab({ c, teams, people }: { c: Challenge; teams: Team[]; people: Standing[] }) {
  const kitGoal = c.goals[0] ?? 42;
  const groups = teams.length > 0
    ? teams.map((t) => ({ key: String(t.id), name: t.name, slug: t.slug, rows: people.filter((p) => p.teamId === t.id) }))
    : [{ key: "geral", name: "Geral", slug: "geral", rows: people }];
  const noTeam = teams.length > 0 ? people.filter((p) => p.teamId === null) : [];
  if (noTeam.length) groups.push({ key: "sem", name: "Sem turma", slug: "geral", rows: noTeam });

  const summary = (name: string, rows: Standing[]) =>
    `Parcial do ${c.name}${teams.length ? ` (turma ${name})` : ""}\n` +
    rows.map((p, i) => `${i + 1}º ${firstName(p.name)} · ${formatKm(p.meters)} km${p.meters >= kitGoal * 1000 ? " · completou!" : ""}`).join("\n") +
    `\n\nRegistre a sua atividade pelo seu link pessoal.\nRanking: ${appUrl(`/d/${c.slug}/ranking`)}`;

  return (
    <section className="feed" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
      {groups.map((g) => {
        const sum = g.rows.reduce((s, p) => s + p.meters, 0);
        return (
          <div key={g.key} className="card stack">
            <div className="row-between">
              <h2 style={{ fontSize: 18 }}>{g.name}</h2>
              <span className="tiny muted">{g.rows.length} pessoas · {formatKm(sum)} km</span>
            </div>
            {g.rows.map((p, i) => (
              <div key={p.id} className="stack" style={{ gap: 4 }}>
                <div className="row small" style={{ gap: 8 }}>
                  <span className="muted strong" style={{ width: 26 }}>{i + 1}º</span>
                  <span style={{ flex: 1, minWidth: 0 }}>{p.name}</span>
                  <b>{formatKm(p.meters)} km</b>
                </div>
                <div style={{ marginLeft: 34 }}><ProgressBar meters={p.meters} goalKm={kitGoal} small /></div>
              </div>
            ))}
            <div className="bubble small" style={{ alignSelf: "stretch", maxWidth: "none" }}>{summary(g.name, g.rows)}</div>
            <CopyButton text={summary(g.name, g.rows)} label="Copiar mensagem para o grupo" className="btn btn-sm btn-ok" />
          </div>
        );
      })}
      <div className="card stack">
        <h2 style={{ fontSize: 18 }}>Ranking público</h2>
        <p className="small muted">Qualquer pessoa vê pelo link (só primeiro nome e inicial do sobrenome).</p>
        <CopyButton text={appUrl(`/d/${c.slug}/ranking`)} label="Copiar link do ranking" className="btn btn-sm" />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function ConfigTab({ c, teams, people }: { c: Challenge; teams: Team[]; people: Standing[] }) {
  return (
    <section className="panel-cols">
      <ChallengeForm
        action={updateChallenge.bind(null, c.id, c.slug)}
        values={{
          name: c.name,
          description: c.description,
          startDate: c.startDate,
          endDate: c.endDate,
          goals: c.goals.join(", "),
          price: (c.priceCents / 100).toFixed(2).replace(".", ","),
          kitDescription: c.kitDescription,
          kitLinkUrl: c.kitLinkUrl ?? "",
          pixKey: c.pixKey,
          pixName: c.pixName,
          pixCity: c.pixCity,
          organizerName: c.organizerName,
          organizerWhatsapp: c.organizerWhatsapp ? formatWhatsapp(c.organizerWhatsapp) : "",
          registrationOpen: c.registrationOpen,
        }}
      />

      <div className="stack-lg">
        <section className="card stack">
          <h2 style={{ fontSize: 18 }}>Regulamento (PDF)</h2>
          {c.regulationKey ? (
            <a href={publicUrl(c.regulationKey)} target="_blank" rel="noopener" className="strong">{c.regulationName ?? "regulamento.pdf"}</a>
          ) : (
            <p className="small muted">Nenhum PDF enviado ainda.</p>
          )}
          <UploadForm action={uploadChallengeFile.bind(null, c.id, c.slug, "regulation")} accept="application/pdf" label={c.regulationKey ? "Trocar PDF" : "Enviar PDF"} />
        </section>

        <section className="card stack">
          <h2 style={{ fontSize: 18 }}>Foto do kit</h2>
          {c.kitImageKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={publicUrl(c.kitImageKey)} alt="Foto do kit" style={{ borderRadius: 10, maxHeight: 220, objectFit: "contain" }} />
          ) : (
            <p className="small muted">Aparece na página do desafio.</p>
          )}
          <UploadForm
            action={uploadChallengeFile.bind(null, c.id, c.slug, "kit")}
            accept="image/jpeg,image/png,image/webp"
            label={c.kitImageKey ? "Trocar foto" : "Enviar foto"}
            image={{ maxSide: KIT_IMAGE_MAX_SIDE_PX, quality: KIT_IMAGE_JPEG_QUALITY, maxBytes: KIT_IMAGE_MAX_BYTES }}
          />
        </section>

        <section className="card stack">
          <h2 style={{ fontSize: 18 }}>Turmas</h2>
          <p className="small muted">Cada turma tem o próprio link de inscrição e o próprio ranking. Sem turmas, todo mundo fica num ranking só.</p>
          {teams.map((t) => {
            const link = appUrl(`/d/${c.slug}?turma=${t.slug}`);
            const n = people.filter((p) => p.teamId === t.id).length;
            return (
              <div key={t.id} className="list-item" style={{ flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                  <div className="strong">{t.name}</div>
                  <div className="tiny muted" style={{ wordBreak: "break-all" }}>{link.replace(/^https?:\/\//, "")} · {n} inscritos</div>
                </div>
                <CopyButton text={link} label="Copiar convite" className="btn btn-sm" />
                <form action={removeTeam.bind(null, t.id, c.slug)}>
                  <ConfirmSubmit message={`Apagar a turma ${t.name}? Os inscritos continuam no desafio, só ficam sem turma.`}>Apagar</ConfirmSubmit>
                </form>
              </div>
            );
          })}
          <TeamForm action={addTeam.bind(null, c.id, c.slug)} />
        </section>

        <section className="card stack">
          <h2 style={{ fontSize: 18 }}>Fotos das atividades</h2>
          {c.photosDeletedAt ? (
            <p className="small">As fotos foram apagadas em {dateTimeBR(c.photosDeletedAt)}. Os km continuam valendo.</p>
          ) : (
            <>
              <p className="small muted">
                Para economizar espaço, as fotos são apagadas sozinhas {PHOTO_RETENTION_DAYS} dias depois do fim do desafio
                (a partir de {shortDate(photosExpireOn(c.endDate))}). Os km registrados continuam valendo.
              </p>
              {challengePhase(c.startDate, c.endDate) === "after" && (
                <form action={purgePhotosNow.bind(null, c.id, c.slug)}>
                  <ConfirmSubmit message="Apagar agora todas as fotos deste desafio? Os km continuam valendo, mas as fotos não podem ser recuperadas.">
                    Apagar as fotos agora
                  </ConfirmSubmit>
                </form>
              )}
            </>
          )}
        </section>

        <section className="card stack">
          <h2 style={{ fontSize: 18 }}><IconLink size={18} /> Links</h2>
          <div className="small">Inscrição: <b style={{ wordBreak: "break-all" }}>{appUrl(`/d/${c.slug}`)}</b></div>
          <div className="small">Ranking: <b style={{ wordBreak: "break-all" }}>{appUrl(`/d/${c.slug}/ranking`)}</b></div>
        </section>

        <section className="card stack" style={{ borderColor: "var(--bad-line)" }}>
          <h2 style={{ fontSize: 18, color: "var(--bad-ink)" }}>Excluir desafio</h2>
          <p className="small muted">Apaga o desafio com todos os inscritos, atividades e fotos. Use para desafios de teste. Antes, exporte as planilhas se quiser guardar algo.</p>
          <DeleteChallengeForm action={deleteChallenge.bind(null, c.id)} name={c.name} />
        </section>
      </div>
    </section>
  );
}
