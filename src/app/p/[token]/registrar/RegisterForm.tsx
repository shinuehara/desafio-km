"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { IconCamera, IconCheck } from "@/components/Icons";
import type { RegisterState } from "./actions";
import { PHOTO_JPEG_QUALITY, PHOTO_MAX_SIDE_PX } from "@/lib/constants";

type Props = {
  action: (prev: RegisterState, form: FormData) => Promise<RegisterState>;
  today: string;
  yesterday: string | null;
  minDate: string;
  maxDate: string;
};

const QUICK = ["2", "3", "5", "10"];

/** Reduz a foto no próprio celular (fica rápida de enviar mesmo com internet fraca). */
async function compress(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, PHOTO_MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", PHOTO_JPEG_QUALITY));
    // Se a "compressão" ficou maior que o original (ex.: print pequeno), manda o original.
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // formato que o navegador não abre: manda como está
  }
}

export function RegisterForm({ action, today, yesterday, minDate, maxDate }: Props) {
  const [state, dispatch, pending] = useActionState(action, {});
  const [km, setKm] = useState("");
  const [day, setDay] = useState<"hoje" | "ontem" | "outro">(today >= minDate ? "hoje" : "outro");
  const [otherDate, setOtherDate] = useState(maxDate);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setPhoto(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setLocalError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!km.trim()) return setLocalError("Escreva quantos km você fez. Exemplo: 5");
    if (!photo) return setLocalError("Falta a foto: pode ser o print do app, do relógio ou a foto da esteira.");
    setLocalError(null);
    const date = day === "hoje" ? today : day === "ontem" && yesterday ? yesterday : otherDate;
    const fd = new FormData();
    fd.set("km", km);
    fd.set("date", date);
    const blob = await compress(photo);
    const name = blob === photo ? photo.name : "foto.jpg";
    fd.set("photo", new File([blob], name, { type: blob.type || photo.type }));
    startTransition(() => dispatch(fd));
  }

  const dayOptions: { id: "hoje" | "ontem" | "outro"; label: string; show: boolean }[] = [
    { id: "hoje", label: "Hoje", show: today >= minDate && today <= maxDate },
    { id: "ontem", label: "Ontem", show: !!yesterday },
    { id: "outro", label: "Outro dia", show: true },
  ];
  const error = localError ?? state.error;

  return (
    <form onSubmit={onSubmit} className="stack-lg" noValidate>
      <div className="field">
        <label htmlFor="f-km">Quantos km você correu ou caminhou?</label>
        <div className="row" style={{ background: "var(--surface)", border: "2px solid var(--accent)", borderRadius: 16, padding: "6px 18px" }}>
          <input
            id="f-km" inputMode="decimal" autoComplete="off" placeholder="0" value={km}
            onChange={(e) => setKm(e.target.value.replace(/[^\d.,]/g, ""))}
            style={{ flex: 1, minWidth: 0, minHeight: 64, border: 0, background: "transparent", font: "700 44px var(--display)", textAlign: "center", outline: "none" }}
          />
          <span style={{ fontWeight: 600, fontSize: 22, color: "var(--muted)" }}>km</span>
        </div>
        <div className="grid-4">
          {QUICK.map((q) => (
            <button key={q} type="button" className="pill" aria-pressed={km === q} onClick={() => setKm(q)}>{q} km</button>
          ))}
        </div>
      </div>

      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label" style={{ marginBottom: 8 }}>Quando?</legend>
        <div className="grid-3">
          {dayOptions.filter((o) => o.show).map((o) => (
            <button key={o.id} type="button" className="pill" aria-pressed={day === o.id} onClick={() => setDay(o.id)}>{o.label}</button>
          ))}
        </div>
        {day === "outro" && (
          <input type="date" className="input" aria-label="Dia da atividade" min={minDate} max={maxDate} value={otherDate} onChange={(e) => setOtherDate(e.target.value)} />
        )}
      </fieldset>

      <div className="field">
        <div className="label">Foto</div>
        <input ref={fileRef} id="f-foto" type="file" accept="image/*" className="sr-only" onChange={pickPhoto} />
        {!photo ? (
          <label htmlFor="f-foto" className="btn" style={{ flexDirection: "column", minHeight: 120, border: "2px dashed var(--accent)", borderRadius: 16, gap: 6 }}>
            <span style={{ color: "var(--accent)" }}><IconCamera size={32} /></span>
            Tirar foto ou escolher print
            <span className="small muted" style={{ fontWeight: 400 }}>Do app, do relógio ou do painel da esteira</span>
          </label>
        ) : (
          <div className="row" style={{ padding: 10, borderRadius: 16, background: "var(--surface)", border: "2px solid var(--ok)" }}>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Foto escolhida" style={{ width: 64, height: 80, objectFit: "cover", borderRadius: 10, flex: "none" }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="strong row" style={{ color: "var(--ok)", gap: 6 }}><IconCheck size={18} /> Foto adicionada</div>
            </div>
            <button type="button" className="btn btn-link btn-sm" onClick={() => fileRef.current?.click()}>Trocar</button>
          </div>
        )}
      </div>

      {error && <div role="alert" className="alert alert-bad">{error}</div>}

      <button type="submit" className="btn btn-primary btn-big" disabled={pending}>
        {pending ? "Enviando…" : "Salvar"}
      </button>
    </form>
  );
}
