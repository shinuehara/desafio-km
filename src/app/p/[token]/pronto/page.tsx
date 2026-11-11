import Link from "next/link";
import { IconChat, IconCheck } from "@/components/Icons";
import { firstName } from "@/lib/format";
import { personalLink, waTo } from "@/lib/whatsapp";
import { loadParticipant } from "../load";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inscrição feita", robots: { index: false } };

export default async function DonePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { participant: p, challenge: c } = await loadParticipant(token);
  const link = personalLink(token);
  const msg = `Meu link do ${c.name}: ${link}\n\nÉ por ele que eu registro minhas corridas e caminhadas.`;

  return (
    <main className="phone" style={{ paddingTop: 40 }}>
      <div style={{ width: 72, height: 72, borderRadius: 36, background: "var(--ok-soft)", color: "var(--ok)", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center" }}>
        <IconCheck size={38} />
      </div>
      <div className="center">
        <h1>Tudo certo, {firstName(p.name)}!</h1>
        <p className="muted" style={{ marginTop: 8 }}>Sua inscrição foi recebida.</p>
      </div>

      <section className="card-accent stack">
        <div className="strong">Este é o seu link pessoal</div>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg)", fontWeight: 600, wordBreak: "break-all" }}>
          {link.replace(/^https?:\/\//, "")}
        </div>
        <div className="small" style={{ color: "var(--ink-2)" }}>
          É por ele que você anota suas corridas e caminhadas. <b>Não precisa de senha.</b>
        </div>
      </section>

      <a href={waTo(p.whatsapp, msg)} className="btn btn-ok" target="_blank" rel="noopener">
        <IconChat /> Mandar o link no meu WhatsApp
      </a>
      <Link href={`/p/${token}`} className="btn">Abrir minha página</Link>
      <p className="small muted center">
        Dica: ao abrir sua página, toque em <b>Adicionar à tela inicial</b> no menu do navegador e o desafio vira um ícone no seu celular.
      </p>
    </main>
  );
}
