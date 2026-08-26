import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppShell } from "@/components/AppShell";
import { getUser } from "@/actions/auth";
import { getEmailAccounts } from "@/actions/email-accounts";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const onboarded = cookieStore.get("flow_onboarded")?.value === "1";

  if (!onboarded) {
    // Only hit the DB when the cookie is absent (first visit / cleared)
    const accounts = await getEmailAccounts();
    if (accounts.length === 0) redirect("/onboarding");
  }

  return (
    <AppShell user={{ email: user.email ?? "", id: user.id }}>
      {children}
    </AppShell>
  );
}
