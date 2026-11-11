import { redirect } from "next/navigation";
import { Brand } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { login } from "../actions";
import { LoginForm } from "../forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrar no painel", robots: { index: false } };

export default async function AdminLogin() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="phone">
      <Brand />
      <h1>Painel do organizador</h1>
      <LoginForm action={login} />
    </main>
  );
}
