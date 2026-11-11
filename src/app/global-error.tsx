"use client";

/** Último recurso: erro no layout principal. Precisa ter html/body próprios. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f6f5f1", color: "#17181c", margin: 0 }}>
        <main style={{ maxWidth: 480, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <h1 style={{ margin: 0 }}>Ops, algo deu errado</h1>
          <p style={{ margin: 0 }}>Espere um minutinho e tente de novo. Se continuar, avise o organizador do desafio.</p>
          <button type="button" onClick={() => reset()} style={{ minHeight: 54, border: 0, borderRadius: 14, background: "#c2410c", color: "#fff", fontSize: 18, fontWeight: 600 }}>
            Tentar de novo
          </button>
        </main>
      </body>
    </html>
  );
}
