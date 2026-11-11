"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { IconCheck, IconCopy } from "./Icons";

export function CopyButton({ text, label, copiedLabel = "Copiado!", className = "btn btn-dark" }: { text: string; label: string; copiedLabel?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Navegadores antigos: seleciona um campo temporário.
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }
  return (
    <button type="button" className={className} onClick={copy} aria-live="polite">
      {copied ? <IconCheck /> : <IconCopy />}
      {copied ? copiedLabel : label}
    </button>
  );
}

export function SubmitButton({ children, className = "btn btn-primary", pendingText = "Salvando…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
