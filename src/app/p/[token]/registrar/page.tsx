import { BackBar } from "@/components/ui";
import { addDaysISO, todayISO } from "@/lib/dates";
import { loadParticipant } from "../load";
import { registerActivity } from "./actions";
import { RegisterForm } from "./RegisterForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nova atividade", robots: { index: false } };

export default async function RegisterPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { challenge: c } = await loadParticipant(token);
  const today = todayISO();
  const yesterday = addDaysISO(today, -1);
  const maxDate = today < c.endDate ? today : c.endDate;

  return (
    <>
      <BackBar href={`/p/${token}`} />
      <main className="phone">
        <h1>Nova atividade</h1>
        {today < c.startDate ? (
          <div className="alert alert-warn">O desafio ainda não começou. Volte a partir do primeiro dia!</div>
        ) : (
          <RegisterForm
            action={registerActivity.bind(null, token)}
            today={today}
            yesterday={yesterday >= c.startDate && yesterday <= c.endDate ? yesterday : null}
            minDate={c.startDate}
            maxDate={maxDate}
          />
        )}
      </main>
    </>
  );
}
