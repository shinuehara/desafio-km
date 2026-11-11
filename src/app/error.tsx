"use client";

import Link from "next/link";

/** Mostrado quando algo dá errado numa página (ex.: banco fora do ar). */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="phone">
      <div className="brand"><span className="brand-mark">km</span>Desafio KM</div>
      <h1>Ops, algo deu errado</h1>
      <p className="muted">Não foi culpa sua. Espere um minutinho e tente de novo. Se continuar, avise o organizador do desafio.</p>
      <button type="button" className="btn btn-primary" onClick={() => reset()}>Tentar de novo</button>
      <Link href="/" className="btn">Ir para o início</Link>
    </main>
  );
}
