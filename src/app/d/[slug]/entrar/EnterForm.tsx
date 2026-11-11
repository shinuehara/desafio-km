"use client";

import { useState } from "react";
import { IconChat } from "@/components/Icons";

export function EnterForm({ organizerWhatsapp, challengeName }: { organizerWhatsapp: string; challengeName: string }) {
  const [phone, setPhone] = useState("");
  const digits = phone.replace(/\D/g, "");
  const ok = digits.length >= 10;
  const text = `Oi! Perdi meu link do ${challengeName}. Meu WhatsApp da inscrição é ${phone}.`;
  const href = `https://wa.me/${organizerWhatsapp}?text=${encodeURIComponent(text)}`;

  return (
    <div className="stack-lg">
      <div className="field">
        <label htmlFor="f-zap2">WhatsApp com DDD</label>
        <input id="f-zap2" type="tel" inputMode="tel" autoComplete="tel" className="input" placeholder="(11) 91234-5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {organizerWhatsapp ? (
        <a href={ok ? href : undefined} aria-disabled={!ok} className="btn btn-ok" target="_blank" rel="noopener" style={ok ? undefined : { opacity: 0.5, pointerEvents: "none" }}>
          <IconChat /> Pedir meu link ao organizador
        </a>
      ) : (
        <div className="alert alert-warn">Fale com o organizador do desafio para receber seu link de novo.</div>
      )}
      <p className="small muted">Vai abrir o WhatsApp com a mensagem pronta. O organizador responde com o seu link.</p>
    </div>
  );
}
