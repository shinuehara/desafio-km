"use client";

import { useActionState, useState } from "react";
import { IconTruck } from "@/components/Icons";
import { SubmitButton } from "@/components/client";
import type { SignupState } from "./actions";

type Team = { slug: string; name: string };
type Props = {
  action: (prev: SignupState, form: FormData) => Promise<SignupState>;
  teams: Team[];
  presetTeam: string | null;
  sizes: readonly string[];
  regulationUrl: string | null;
  privacyUrl: string;
};

const EMPTY = {
  name: "", whatsapp: "", team: "", shirtSize: "", cep: "", street: "", number: "",
  complement: "", neighborhood: "", city: "", state: "",
};

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function SignupForm({ action, teams, presetTeam, sizes, regulationUrl, privacyUrl }: Props) {
  const [state, formAction] = useActionState(action, {});
  const [v, setV] = useState({ ...EMPTY, team: presetTeam ?? "" });
  const [accept, setAccept] = useState(false);
  const [cepStatus, setCepStatus] = useState<"" | "buscando" | "ok" | "erro">("");
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function onCep(e: React.ChangeEvent<HTMLInputElement>) {
    const cep = maskCep(e.target.value);
    setV((s) => ({ ...s, cep }));
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepStatus("buscando");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const j = await res.json();
      if (j.erro) throw new Error();
      setV((s) => ({
        ...s,
        street: j.logradouro || s.street,
        neighborhood: j.bairro || s.neighborhood,
        city: j.localidade || s.city,
        state: j.uf || s.state,
      }));
      setCepStatus("ok");
    } catch {
      setCepStatus("erro");
    }
  }

  return (
    <form action={formAction} className="stack-lg">
      <div className="field">
        <label htmlFor="f-nome">Seu nome</label>
        <input id="f-nome" name="name" className="input" autoComplete="name" placeholder="Ex.: Maria Fernandes" value={v.name} onChange={set("name")} required />
      </div>

      <div className="field">
        <label htmlFor="f-zap">WhatsApp com DDD</label>
        <input id="f-zap" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" className="input" placeholder="(11) 91234-5678"
          value={v.whatsapp} onChange={(e) => setV((s) => ({ ...s, whatsapp: maskPhone(e.target.value) }))} required />
        <div className="hint">Seu link pessoal chega por aqui.</div>
      </div>

      {teams.length > 0 && !presetTeam && (
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ marginBottom: 8 }}>Sua turma</legend>
          <div className="stack" style={{ gap: 8 }}>
            {teams.map((t) => (
              <label key={t.slug} className="pill">
                <input type="radio" name="team" value={t.slug} checked={v.team === t.slug} onChange={set("team")} />
                {t.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {presetTeam && <input type="hidden" name="team" value={presetTeam} />}

      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label" style={{ marginBottom: 8 }}>Tamanho da camiseta</legend>
        <div className="grid-3">
          {sizes.map((s) => (
            <label key={s} className="pill">
              <input type="radio" name="shirtSize" value={s} checked={v.shirtSize === s} onChange={set("shirtSize")} required />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="card stack">
        <div className="row strong">
          <span style={{ color: "var(--accent)" }}><IconTruck /></span>
          Onde entregar o kit
        </div>
        <div className="hint">Digite o CEP que a gente preenche o resto.</div>
        <div className="field">
          <label htmlFor="f-cep">CEP</label>
          <input id="f-cep" name="cep" inputMode="numeric" autoComplete="postal-code" className="input" placeholder="00000-000" value={v.cep} onChange={onCep} required />
          {cepStatus === "buscando" && <div className="hint">Buscando endereço…</div>}
          {cepStatus === "erro" && <div className="hint">Não achamos esse CEP. Preencha o endereço abaixo.</div>}
        </div>
        <div className="field">
          <label htmlFor="f-rua">Rua</label>
          <input id="f-rua" name="street" autoComplete="address-line1" className="input" value={v.street} onChange={set("street")} required />
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="f-num">Número</label>
            <input id="f-num" name="number" inputMode="numeric" className="input" value={v.number} onChange={set("number")} required />
          </div>
          <div className="field">
            <label htmlFor="f-comp">Complemento</label>
            <input id="f-comp" name="complement" className="input" placeholder="Apto, bloco…" value={v.complement} onChange={set("complement")} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-bairro">Bairro</label>
          <input id="f-bairro" name="neighborhood" className="input" value={v.neighborhood} onChange={set("neighborhood")} />
        </div>
        <div className="grid-2" style={{ gridTemplateColumns: "minmax(0, 3fr) minmax(0, 1fr)", gap: 12 }}>
          <div className="field">
            <label htmlFor="f-cidade">Cidade</label>
            <input id="f-cidade" name="city" autoComplete="address-level2" className="input" value={v.city} onChange={set("city")} required />
          </div>
          <div className="field">
            <label htmlFor="f-uf">Estado</label>
            <input id="f-uf" name="state" autoComplete="address-level1" className="input" maxLength={2} placeholder="SP" value={v.state} onChange={set("state")} required />
          </div>
        </div>
      </div>

      <p className="small" style={{ color: "var(--ink-2)" }}>
        Usamos seus dados só para organizar o desafio e enviar o kit. No ranking aparece apenas o seu primeiro nome e a
        inicial do sobrenome. <a href={privacyUrl} target="_blank" rel="noopener">Como cuidamos dos seus dados</a>
      </p>
      <label className="check" htmlFor="f-aceite" style={{ minHeight: 60, paddingBlock: 10 }}>
        <input id="f-aceite" type="checkbox" name="accept" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
        <span>
          Li e aceito o{" "}
          {regulationUrl ? <a href={regulationUrl} target="_blank" rel="noopener"><b>regulamento</b></a> : <b>regulamento</b>}
          {" "}e o uso dos meus dados para o desafio
        </span>
      </label>

      {state.error && <div role="alert" className="alert alert-bad">{state.error}</div>}

      <SubmitButton pendingText="Enviando…">Continuar para o pagamento</SubmitButton>
    </form>
  );
}
