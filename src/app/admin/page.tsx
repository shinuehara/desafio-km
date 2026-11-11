import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listChallenges } from "@/lib/queries";
import { deadlineLabel, shortDate } from "@/lib/dates";
import { logout } from "./actions";
import { ConfigBanner } from "./ConfigBanner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Painel" };

export default async function AdminHome() {
  await requireAdmin();
  const list = await listChallenges();
  return (
    <>
      <header className="admin-top">
        <div className="admin-top-inner">
          <div className="brand" style={{ color: "#fff" }}><span className="brand-mark">km</span> Painel do organizador</div>
          <form action={logout}><button className="btn btn-sm btn-dark" style={{ border: "1px solid #555" }}>Sair</button></form>
        </div>
      </header>
      <main className="admin">
        <ConfigBanner />
        <div className="row-between">
          <h1>Desafios</h1>
          <Link href="/admin/novo" className="btn btn-primary btn-sm" style={{ minHeight: 44 }}>+ Novo desafio</Link>
        </div>
        {list.length === 0 && <p className="muted">Crie o primeiro desafio para começar.</p>}
        <div className="stack">
          {list.map((c) => (
            <Link key={c.id} href={`/admin/d/${c.slug}`} className="list-item" style={{ color: "inherit", textDecoration: "none" }}>
              <div style={{ flex: 1 }}>
                <div className="strong">{c.name}</div>
                <div className="small muted">{shortDate(c.startDate)} a {shortDate(c.endDate)} · {deadlineLabel(c.startDate, c.endDate)}</div>
              </div>
              <span className={`chip ${c.registrationOpen ? "chip-ok" : "chip-neutral"}`}>{c.registrationOpen ? "inscrições abertas" : "inscrições fechadas"}</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
