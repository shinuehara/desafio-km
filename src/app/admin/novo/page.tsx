import { BackBar } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { addDaysISO, todayISO } from "@/lib/dates";
import { createChallenge } from "../actions";
import { ChallengeForm } from "../forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo desafio" };

export default async function NewChallenge() {
  await requireAdmin();
  const start = todayISO();
  return (
    <>
      <BackBar href="/admin" />
      <main className="admin" style={{ maxWidth: 720 }}>
        <h1>Novo desafio</h1>
        <ChallengeForm
          isNew
          action={createChallenge}
          values={{
            name: "", description: "", startDate: start, endDate: addDaysISO(start, 60), goals: "42, 100", price: "",
            kitDescription: "Camiseta + medalha", pixKey: "", pixName: "", pixCity: "", organizerName: "",
            organizerWhatsapp: "", registrationOpen: true,
          }}
        />
      </main>
    </>
  );
}
