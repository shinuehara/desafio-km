import Link from "next/link";
import { Brand } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="phone">
      <Brand />
      <h1>Página não encontrada</h1>
      <p className="muted">Confira se o link está completo. Se for o seu link pessoal, procure a mensagem original no WhatsApp.</p>
      <Link href="/" className="btn">Ir para o início</Link>
    </main>
  );
}
