import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Brand, Steps } from "@/components/ui";
import { IconCalendar, IconFile, IconMedal, IconTruck } from "@/components/Icons";
import { getChallenge } from "@/lib/queries";
import { challengePhase, deadlineLabel, shortDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { publicUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ turma?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getChallenge((await params).slug);
  return c ? { title: c.name, description: c.description || undefined } : {};
}

function kitLinkLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").startsWith("instagram.com") ? "ver o kit no Instagram" : "ver o kit em detalhes";
  } catch {
    return "ver o kit em detalhes";
  }
}

export default async function ChallengePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { turma } = await searchParams;
  const c = await getChallenge(slug);
  if (!c) notFound();

  const firstGoal = c.goals[0] ?? 42;
  const phase = challengePhase(c.startDate, c.endDate);
  const canRegister = c.registrationOpen && phase !== "after";
  const q = turma ? `?turma=${encodeURIComponent(turma)}` : "";

  return (
    <main className="phone">
      <Brand href={`/d/${c.slug}`} />

      <section className="card-dark">
        <div className="kicker">Caminhada e corrida · online</div>
        <h1 style={{ fontSize: 40 }}>{c.name}</h1>
        <p style={{ fontSize: 17 }}>
          {c.description ||
            `Corra ou caminhe ${firstGoal} km entre ${shortDate(c.startDate)} e ${shortDate(c.endDate)}, no seu ritmo e onde quiser: rua, parque ou esteira.`}
        </p>
      </section>

      {c.kitImageKey && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={publicUrl(c.kitImageKey)} alt={`Kit do desafio: ${c.kitDescription}`} width={1200} height={900} style={{ borderRadius: 18, width: "100%", height: "auto" }} />
      )}

      <section className="card stack">
        <div className="row">
          <span style={{ color: "var(--accent)" }}><IconCalendar size={24} /></span>
          <div><b>{shortDate(c.startDate)} a {shortDate(c.endDate)}</b> · {deadlineLabel(c.startDate, c.endDate)}</div>
        </div>
        <div className="row">
          <span style={{ color: "var(--accent)" }}><IconMedal size={24} /></span>
          <div>
            <b>{c.kitDescription}</b> para quem completar {firstGoal} km
            {c.kitLinkUrl && (
              <>
                {" · "}
                <a href={c.kitLinkUrl} target="_blank" rel="noopener noreferrer">
                  {kitLinkLabel(c.kitLinkUrl)}
                </a>
              </>
            )}
          </div>
        </div>
        <div className="row">
          <span style={{ color: "var(--accent)" }}><IconTruck size={24} /></span>
          <div><b>Frete incluso</b> · o kit chega na sua casa</div>
        </div>
        <div className="row-between" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <span className="muted">Inscrição</span>
          <span style={{ font: "700 26px var(--display)" }}>{formatMoney(c.priceCents)}</span>
        </div>
      </section>

      <div className="stack">
        {canRegister ? (
          <Link href={`/d/${c.slug}/inscricao${q}`} className="btn btn-primary">Quero participar</Link>
        ) : (
          <div className="alert alert-warn">As inscrições estão fechadas.</div>
        )}
        {c.regulationKey && (
          <a href={publicUrl(c.regulationKey)} className="btn" target="_blank" rel="noopener">
            <IconFile /> Ler o regulamento (PDF)
          </a>
        )}
        <div className="grid-2">
          <Link href={`/d/${c.slug}/entrar`} className="btn btn-link">Já me inscrevi</Link>
          <Link href={`/d/${c.slug}/ranking`} className="btn btn-link">Ver o ranking</Link>
        </div>
      </div>

      <section className="stack">
        <h2>Como funciona</h2>
        <Steps
          items={[
            <>Faça a inscrição e pague com <b>PIX</b>.</>,
            <>Receba o <b>seu link</b> no WhatsApp. Não precisa de senha.</>,
            <>Depois de cada corrida ou caminhada, abra o link, <b>anote os km</b> e mande uma foto.</>,
          ]}
        />
      </section>
    </main>
  );
}
