import { notFound } from "next/navigation";
import { BackBar } from "@/components/ui";
import { getChallenge } from "@/lib/queries";
import { formatWhatsapp } from "@/lib/format";
import { PHOTO_RETENTION_DAYS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Como cuidamos dos seus dados" };

/** Aviso de privacidade em linguagem simples (LGPD). */
export default async function PrivacyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getChallenge(slug);
  if (!c) notFound();
  const contact = c.organizerWhatsapp
    ? `${c.organizerName ? c.organizerName + ", " : ""}pelo WhatsApp ${formatWhatsapp(c.organizerWhatsapp)}`
    : c.organizerName || "o organizador do desafio";

  return (
    <>
      <BackBar href={`/d/${c.slug}`} />
      <main className="phone">
        <h1>Como cuidamos dos seus dados</h1>
        <p className="muted">{c.name}</p>

        <section className="stack">
          <h2>O que guardamos</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Nome, WhatsApp e tamanho da camiseta.</li>
            <li>Endereço, para enviar o kit.</li>
            <li>Os km que você registra e as fotos que comprovam cada atividade.</li>
          </ul>
        </section>

        <section className="stack">
          <h2>Para que usamos</h2>
          <p>Só para organizar o desafio: calcular seu progresso e o ranking, falar com você pelo WhatsApp e enviar a camiseta e a medalha. Não vendemos nem passamos seus dados para ninguém.</p>
        </section>

        <section className="stack">
          <h2>Quem vê o quê</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li><b>Ranking público:</b> só o seu primeiro nome, a inicial do sobrenome, a turma e os km.</li>
            <li><b>Organizador:</b> vê seus dados de inscrição e as fotos, para conferir as atividades e enviar o kit.</li>
            <li><b>Ninguém mais</b> vê seu WhatsApp, seu endereço ou suas fotos.</li>
          </ul>
        </section>

        <section className="stack">
          <h2>Por quanto tempo</h2>
          <p>As fotos das atividades são apagadas {PHOTO_RETENTION_DAYS} dias depois do fim do desafio. Os outros dados ficam guardados enquanto o organizador mantiver o desafio no sistema.</p>
        </section>

        <section className="stack">
          <h2>Seus direitos</h2>
          <p>Você pode pedir para ver, corrigir ou apagar seus dados a qualquer momento. Fale com {contact}.</p>
        </section>

        <section className="stack">
          <h2>Onde ficam guardados</h2>
          <p className="small muted">Em serviços de hospedagem contratados pelo organizador (banco de dados e arquivos no Supabase, site na Netlify), com acesso protegido. O seu link pessoal funciona como senha: não compartilhe.</p>
        </section>
      </main>
    </>
  );
}
