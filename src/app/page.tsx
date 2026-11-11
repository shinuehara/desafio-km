import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/ui";
import { listChallenges } from "@/lib/queries";
import { deadlineLabel, shortDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function Home() {
  const all = await listChallenges();
  const open = all.filter((c) => c.registrationOpen);
  if (open.length === 1) redirect(`/d/${open[0].slug}`);

  return (
    <main className="phone">
      <Brand />
      <h1>Desafios</h1>
      {all.length === 0 ? (
        <p className="muted">Nenhum desafio criado ainda.</p>
      ) : (
        <div className="stack">
          {all.map((c) => (
            <Link key={c.id} href={`/d/${c.slug}`} className="list-item" style={{ color: "inherit", textDecoration: "none" }}>
              <div style={{ flex: 1 }}>
                <div className="strong">{c.name}</div>
                <div className="small muted">
                  {shortDate(c.startDate)} a {shortDate(c.endDate)} · {deadlineLabel(c.startDate, c.endDate)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
