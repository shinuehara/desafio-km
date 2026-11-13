"use client";

import { startTransition, useActionState, useState } from "react";
import { compressImage } from "@/lib/image-client";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { SubmitButton } from "@/components/client";
import type { FormState } from "./actions";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <div role="alert" className="alert alert-bad">{state.error}</div>;
  if (state.ok) return <div role="status" className="alert alert-ok">{state.ok}</div>;
  return null;
}

export function LoginForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="stack-lg">
      <div className="field">
        <label htmlFor="pw">Senha do organizador</label>
        <input id="pw" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      <Feedback state={state} />
      <SubmitButton pendingText="Entrando…">Entrar</SubmitButton>
    </form>
  );
}

export type ChallengeValues = {
  name: string; slug?: string; description: string; startDate: string; endDate: string; goals: string; price: string;
  kitDescription: string; kitLinkUrl: string; pixKey: string; pixName: string; pixCity: string; organizerName: string;
  organizerWhatsapp: string; registrationOpen: boolean;
};

export function ChallengeForm({ action, values, isNew }: { action: Action; values: ChallengeValues; isNew?: boolean }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="stack-lg">
      <section className="card stack">
        <h2 style={{ fontSize: 18 }}>Desafio</h2>
        <div className="field">
          <label htmlFor="c-nome">Nome do desafio</label>
          <input id="c-nome" name="name" className="input" defaultValue={values.name} required />
        </div>
        {isNew && (
          <div className="field">
            <label htmlFor="c-slug">Endereço (opcional)</label>
            <input id="c-slug" name="slug" className="input" placeholder="ex.: 42km-natal" defaultValue={values.slug} />
            <div className="hint">Aparece no link: /d/<b>endereço</b>. Se deixar em branco, usamos o nome.</div>
          </div>
        )}
        <div className="field">
          <label htmlFor="c-desc">Descrição curta (opcional)</label>
          <textarea id="c-desc" name="description" className="input" defaultValue={values.description} placeholder="Corra ou caminhe 42 km entre… no seu ritmo, onde quiser." />
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="c-ini">Início</label>
            <input id="c-ini" name="startDate" type="date" className="input" defaultValue={values.startDate} required />
          </div>
          <div className="field">
            <label htmlFor="c-fim">Fim</label>
            <input id="c-fim" name="endDate" type="date" className="input" defaultValue={values.endDate} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="c-metas">Metas em km</label>
          <input id="c-metas" name="goals" className="input" defaultValue={values.goals} required />
          <div className="hint">Separe por vírgula. A primeira dá direito ao kit; as outras são opcionais (ex.: 42, 100).</div>
        </div>
        <div className="field">
          <label htmlFor="c-kit">O que vem no kit</label>
          <input id="c-kit" name="kitDescription" className="input" defaultValue={values.kitDescription} required />
        </div>
        <div className="field">
          <label htmlFor="c-kitlink">Link para ver o kit em detalhes (opcional)</label>
          <input id="c-kitlink" name="kitLinkUrl" type="url" inputMode="url" className="input" defaultValue={values.kitLinkUrl} placeholder="https://www.instagram.com/p/…" />
          <div className="hint">Ex.: o post do Instagram com as fotos da camiseta e da medalha. Aparece na página do desafio.</div>
        </div>
        <label className="check" htmlFor="c-aberto">
          <input id="c-aberto" type="checkbox" name="registrationOpen" defaultChecked={values.registrationOpen} />
          <span>Inscrições abertas</span>
        </label>
      </section>

      <section className="card stack">
        <h2 style={{ fontSize: 18 }}>Pagamento (PIX)</h2>
        <div className="field">
          <label htmlFor="c-valor">Valor da inscrição, com frete (R$)</label>
          <input id="c-valor" name="price" inputMode="decimal" className="input" defaultValue={values.price} placeholder="120,00" required />
        </div>
        <div className="field">
          <label htmlFor="c-pix">Chave PIX</label>
          <input id="c-pix" name="pixKey" className="input" defaultValue={values.pixKey} placeholder="CPF, e-mail, celular (+55…) ou chave aleatória" />
          <div className="hint">Pode digitar do jeito que preferir (com pontos, traços ou parênteses): o sistema reconhece o tipo e salva no formato que os bancos exigem. Depois confira no “Teste do PIX”.</div>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="c-pixnome">Nome do recebedor</label>
            <input id="c-pixnome" name="pixName" className="input" maxLength={25} defaultValue={values.pixName} />
          </div>
          <div className="field">
            <label htmlFor="c-pixcidade">Cidade do recebedor</label>
            <input id="c-pixcidade" name="pixCity" className="input" maxLength={15} defaultValue={values.pixCity} />
          </div>
        </div>
      </section>

      <section className="card stack">
        <h2 style={{ fontSize: 18 }}>Organizador</h2>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="c-org">Nome</label>
            <input id="c-org" name="organizerName" className="input" defaultValue={values.organizerName} />
          </div>
          <div className="field">
            <label htmlFor="c-orgzap">WhatsApp</label>
            <input id="c-orgzap" name="organizerWhatsapp" type="tel" className="input" defaultValue={values.organizerWhatsapp} placeholder="(11) 91234-5678" />
          </div>
        </div>
        <div className="hint">Quem perder o link pessoal manda mensagem para este WhatsApp.</div>
      </section>

      <Feedback state={state} />
      <SubmitButton>{isNew ? "Criar desafio" : "Salvar alterações"}</SubmitButton>
    </form>
  );
}

type ImageOptions = { maxSide: number; quality: number; maxBytes: number };

export function UploadForm({ action, accept, label, image }: { action: Action; accept: string; label: string; image?: ImageOptions }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [problem, setProblem] = useState<string | null>(null);

  // Fotos são reduzidas no navegador antes do envio; PDFs vão como estão.
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!image) return;
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const small = await compressImage(file, image.maxSide, image.quality);
    if (small.size > image.maxBytes) {
      setProblem(`Mesmo reduzida, a foto ficou com ${(small.size / 1024 / 1024).toFixed(1)} MB. Use uma foto JPG ou PNG comum.`);
      return;
    }
    setProblem(null);
    const fd = new FormData();
    fd.set("file", small);
    startTransition(() => formAction(fd));
  }

  return (
    <form action={formAction} onSubmit={onSubmit} className="stack">
      <input
        type="file" name="file" accept={accept} aria-label={label} className="input" style={{ paddingTop: 10 }} required
        onChange={(e) => {
          const big = !image && (e.target.files?.[0]?.size ?? 0) > MAX_UPLOAD_BYTES;
          setProblem(big ? "Arquivo maior que 5 MB. Escolha um arquivo menor." : null);
          if (big) e.target.value = "";
        }}
      />
      {problem && <div role="alert" className="alert alert-bad">{problem}</div>}
      <div className="hint">{image ? "A foto é reduzida automaticamente antes de enviar." : "Até 5 MB."}</div>
      <Feedback state={state} />
      <button type="submit" className="btn btn-sm" disabled={pending}>{pending ? "Enviando…" : label}</button>
    </form>
  );
}

export function TeamForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="stack">
      <div className="row">
        <input name="name" className="input" placeholder="Nome da nova turma" aria-label="Nome da nova turma" required />
        <SubmitButton className="btn btn-sm" pendingText="…">Criar turma</SubmitButton>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function ConfirmSubmit({ children, message, className = "btn btn-sm btn-danger" }: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button type="submit" className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}

export function ManualKmForm({ action, people, minDate, maxDate }: { action: Action; people: { id: number; name: string }[]; minDate: string; maxDate: string }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="card stack">
      <h2 style={{ fontSize: 18 }}>Lançar km pelo organizador</h2>
      <p className="small muted">
        Para o saldo de quem já corria antes do sistema, ou para corrigir algo (ex.: a pessoa mandou a foto no grupo).
        Entra no total na hora, sem foto, e aparece como “lançado pelo organizador”.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, alignItems: "end" }}>
        <div className="field">
          <label htmlFor="m-pessoa">Participante</label>
          <select id="m-pessoa" name="participantId" className="input" required defaultValue="">
            <option value="" disabled>Escolha…</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="m-km">Km</label>
          <input id="m-km" name="km" inputMode="decimal" className="input" placeholder="23,4" required />
        </div>
        <div className="field">
          <label htmlFor="m-dia">Dia</label>
          <input id="m-dia" name="date" type="date" className="input" min={minDate} max={maxDate} defaultValue={maxDate} required />
        </div>
        <div className="field">
          <label htmlFor="m-motivo">Motivo</label>
          <input id="m-motivo" name="note" className="input" placeholder="Saldo antes do sistema" maxLength={120} />
        </div>
      </div>
      <Feedback state={state} />
      <SubmitButton className="btn btn-sm btn-dark" pendingText="Lançando…">Lançar km</SubmitButton>
    </form>
  );
}

export function DeleteChallengeForm({ action, name }: { action: Action; name: string }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="stack">
      <div className="field">
        <label htmlFor="d-nome">Para confirmar, digite o nome do desafio: <b>{name}</b></label>
        <input id="d-nome" name="confirmName" className="input" autoComplete="off" required />
      </div>
      <Feedback state={state} />
      <ConfirmSubmit message={`Excluir “${name}” com todos os inscritos, atividades e fotos? Isso não pode ser desfeito.`}>
        Excluir desafio
      </ConfirmSubmit>
    </form>
  );
}
