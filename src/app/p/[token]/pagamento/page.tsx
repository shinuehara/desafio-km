import Link from "next/link";
import QRCode from "qrcode";
import { CopyButton } from "@/components/client";
import { Steps } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { pixPayload } from "@/lib/pix";
import { normalizePixKey } from "@/lib/pix-key";
import { loadParticipant } from "../load";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pagamento", robots: { index: false } };

export default async function PaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { participant: p, challenge: c } = await loadParticipant(token);

  if (p.paidAt) {
    return (
      <main className="phone">
        <div className="alert alert-ok">Seu pagamento já foi confirmado. Está tudo certo!</div>
        <Link href={`/p/${token}`} className="btn btn-primary">Abrir minha página</Link>
      </main>
    );
  }

  let code: string | null = null;
  let qr: string | null = null;
  if (c.pixKey && c.priceCents > 0) {
    const k = normalizePixKey(c.pixKey);
    code = pixPayload({ key: k.ok ? k.value : c.pixKey, name: c.pixName || c.organizerName, city: c.pixCity, amountCents: c.priceCents, txid: `DKM${p.token}` });
    qr = await QRCode.toDataURL(code, { margin: 1, width: 440, errorCorrectionLevel: "M" });
  }

  return (
    <main className="phone">
      <div>
        <div className="small strong" style={{ color: "var(--accent-ink)" }}>Passo 2 de 2</div>
        <h1 style={{ marginTop: 4 }}>Pague com PIX</h1>
      </div>

      {code && qr ? (
        <>
          <section className="card stack" style={{ alignItems: "center" }}>
            <div className="center">
              <div style={{ font: "700 34px var(--display)" }}>{formatMoney(c.priceCents)}</div>
              <div className="small muted">Inscrição + kit + frete</div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR Code do PIX" width={220} height={220} style={{ border: "1px solid var(--line)", borderRadius: 12 }} />
            <div className="small muted center">
              Recebedor: <b style={{ color: "var(--ink)" }}>{c.pixName || c.organizerName}</b>
            </div>
            <CopyButton text={code} label="Copiar código PIX" copiedLabel="Código copiado!" />
          </section>

          <section className="stack">
            <div className="strong">Como pagar</div>
            <Steps
              items={[
                <>Toque em <b>Copiar código PIX</b>.</>,
                <>Abra o app do seu banco e escolha <b>PIX › Copia e Cola</b>.</>,
                <>Cole o código e confirme. Depois volte aqui.</>,
              ]}
            />
          </section>
        </>
      ) : (
        <div className="alert alert-warn">O organizador ainda vai informar os dados do PIX. Sua inscrição já está guardada.</div>
      )}

      <Link href={`/p/${token}/pronto`} className="btn btn-primary">Já paguei</Link>
      <p className="small muted center">O organizador confirma o pagamento e avisa você pelo WhatsApp.</p>
    </main>
  );
}
