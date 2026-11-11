import { notFound } from "next/navigation";
import { BackBar } from "@/components/ui";
import { getChallenge, listTeams } from "@/lib/queries";
import { publicUrl } from "@/lib/storage";
import { challengePhase } from "@/lib/dates";
import { SHIRT_SIZES } from "@/lib/constants";
import { signup } from "./actions";
import { SignupForm } from "./SignupForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inscrição" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ turma?: string }> };

export default async function SignupPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { turma } = await searchParams;
  const c = await getChallenge(slug);
  if (!c) notFound();
  const teams = await listTeams(c.id);
  const preset = teams.find((t) => t.slug === turma)?.slug ?? null;
  const closed = !c.registrationOpen || challengePhase(c.startDate, c.endDate) === "after";

  return (
    <>
      <BackBar href={`/d/${c.slug}${preset ? `?turma=${preset}` : ""}`} />
      <main className="phone">
        <div>
          <div className="small strong" style={{ color: "var(--accent-ink)" }}>Passo 1 de 2</div>
          <h1 style={{ marginTop: 4 }}>Sua inscrição</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {c.name}
            {preset ? ` · turma ${teams.find((t) => t.slug === preset)?.name}` : ""} · leva uns 2 minutos.
          </p>
        </div>
        {closed ? (
          <div className="alert alert-warn">As inscrições estão fechadas.</div>
        ) : (
          <SignupForm
            action={signup.bind(null, c.slug)}
            teams={teams.map((t) => ({ slug: t.slug, name: t.name }))}
            presetTeam={preset}
            sizes={SHIRT_SIZES}
            regulationUrl={c.regulationKey ? publicUrl(c.regulationKey) : null}
          />
        )}
      </main>
    </>
  );
}
