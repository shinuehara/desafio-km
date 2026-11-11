import { configIssues } from "@/lib/config";

/** Mostra no painel o que falta configurar na hospedagem. Some quando está tudo certo. */
export function ConfigBanner() {
  const issues = configIssues();
  if (issues.length === 0) return null;
  const hasError = issues.some((i) => i.level === "erro");
  return (
    <div role="alert" className={`alert ${hasError ? "alert-bad" : "alert-warn"}`} style={{ fontWeight: 400 }}>
      <div className="strong">{hasError ? "Configuração incompleta" : "Atenção à configuração"}</div>
      <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
        {issues.map((i) => <li key={i.text}>{i.text}</li>)}
      </ul>
      <div className="small" style={{ marginTop: 6 }}>Veja o passo a passo em LANCAMENTO.md no repositório.</div>
    </div>
  );
}
