import Link from "next/link";
import type { Metadata } from "next";
import { BackBar } from "@/components/ui";
import { addDaysISO, todayISO } from "@/lib/dates";
import { loadParticipant } from "../load";
import { registerActivity } from "./actions";
import { RegisterForm } from "./RegisterForm";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ token: string }> };

/** Título e descrição aparecem na prévia do link no WhatsApp. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const { challenge: c } = await loadParticipant(token);
  const title = `Registrar atividade · ${c.name}`;
  const description = "Toque para anotar seus km e mandar a foto.";
  return {
    title,
    description,
    robots: { index: false, follow: false },
    manifest: `/p/${token}/manifest.webmanifest`,
    openGraph: { title, description, images: [{ url: "/og.png", width: 1200, height: 630 }] },
  };
}

export default async function RegisterPage({ params }: Props) {
  const { token } = await params;
  const { challenge: c } = await loadParticipant(token);
  const today = todayISO();
  const yesterday = addDaysISO(today, -1);
  const maxDate = today < c.endDate ? today : c.endDate;

  return (
    <>
      <BackBar href={`/p/${token}`} label="Minha página" />
      <main className="phone">
        <h1>Nova atividade</h1>
        {today < c.startDate ? (
          <div className="alert alert-warn">O desafio ainda não começou. Volte a partir do primeiro dia!</div>
        ) : (
          <RegisterForm
            action={registerActivity.bind(null, token)}
            today={today}
            yesterday={yesterday >= c.startDate && yesterday <= c.endDate ? yesterday : null}
            minDate={c.startDate}
            maxDate={maxDate}
          />
        )}
        <Link href={`/p/${token}`} className="btn btn-link">Ver meu progresso e o ranking</Link>
      </main>
    </>
  );
}
