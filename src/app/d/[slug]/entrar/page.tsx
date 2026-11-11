import { notFound } from "next/navigation";
import { BackBar } from "@/components/ui";
import { getChallenge } from "@/lib/queries";
import { EnterForm } from "./EnterForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Já me inscrevi" };

export default async function EnterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getChallenge(slug);
  if (!c) notFound();
  return (
    <>
      <BackBar href={`/d/${c.slug}`} />
      <main className="phone">
        <h1>Já me inscrevi</h1>
        <p style={{ color: "var(--ink-2)" }}>
          Sua página fica no <b>link pessoal</b> que você recebeu no WhatsApp. Procure a mensagem com o link e toque nele.
        </p>
        <p style={{ color: "var(--ink-2)" }}>Não achou? Digite seu WhatsApp e peça o link de novo:</p>
        <EnterForm organizerWhatsapp={c.organizerWhatsapp} challengeName={c.name} />
      </main>
    </>
  );
}
