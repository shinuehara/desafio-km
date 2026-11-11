import Link from "next/link";
import { IconBack } from "./Icons";
import { formatKm, percent } from "@/lib/format";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="brand">
      <span className="brand-mark">km</span>
      Desafio KM
    </Link>
  );
}

export function BackBar({ href, label = "Voltar" }: { href: string; label?: string }) {
  return (
    <div className="backbar">
      <div className="backbar-inner">
        <Link href={href}>
          <IconBack /> {label}
        </Link>
      </div>
    </div>
  );
}

export function ProgressBar({ meters, goalKm, small, label }: { meters: number; goalKm: number; small?: boolean; label?: string }) {
  const pct = percent(meters, goalKm);
  const done = meters >= goalKm * 1000;
  return (
    <div
      className={`bar${small ? " bar-sm" : ""}${done ? " done" : ""}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label ?? `${formatKm(meters)} de ${goalKm} km`}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="stack">
      {items.map((item, i) => (
        <div className="step" key={i}>
          <div className="step-n">{i + 1}</div>
          <div>{item}</div>
        </div>
      ))}
    </div>
  );
}
